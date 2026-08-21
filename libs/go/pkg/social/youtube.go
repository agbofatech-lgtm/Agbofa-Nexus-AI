package social

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const (
	youtubeUploadURL   = "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status"
	youtubeChannelsURL = "https://www.googleapis.com/youtube/v3/channels?part=id,snippet&mine=true"
	googleUserInfoURL  = "https://openidconnect.googleapis.com/v1/userinfo"
	youtubeMaxMedia    = 64 << 20 // 64 MiB in-process cap; larger uploads fail closed
)

// YouTubeAdapter talks to Google OAuth and the YouTube Data API v3.
// It never invents a video id.
type YouTubeAdapter struct {
	OAuthClient
}

func NewYouTubeAdapter(httpClient HTTPClient) YouTubeAdapter {
	spec, _ := Lookup(string(PlatformYouTube))
	return YouTubeAdapter{OAuthClient: OAuthClient{
		Spec:      spec,
		ClientID:  ClientID(PlatformYouTube),
		ClientSec: ClientSecret(PlatformYouTube),
		HTTP:      httpClient,
	}}
}

func (y YouTubeAdapter) Identify(ctx context.Context, tokens TokenSet) (accountID, accountName string, err error) {
	if tokens.AccessToken == "" {
		return "", "", ErrReauthRequired
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, youtubeChannelsURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	res, err := y.do(req)
	if err != nil {
		return "", "", err
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusUnauthorized {
		return "", "", ErrReauthRequired
	}
	if res.StatusCode < 300 {
		var parsed struct {
			Items []struct {
				ID      string `json:"id"`
				Snippet struct {
					Title string `json:"title"`
				} `json:"snippet"`
			} `json:"items"`
		}
		if err := json.NewDecoder(io.LimitReader(res.Body, 1<<20)).Decode(&parsed); err == nil && len(parsed.Items) > 0 && parsed.Items[0].ID != "" {
			return parsed.Items[0].ID, parsed.Items[0].Snippet.Title, nil
		}
	}
	return y.identifyUserInfo(ctx, tokens)
}

func (y YouTubeAdapter) identifyUserInfo(ctx context.Context, tokens TokenSet) (accountID, accountName string, err error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, googleUserInfoURL, nil)
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	res, err := y.do(req)
	if err != nil {
		return "", "", err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return "", "", ErrProviderIdentity
	}
	var info struct {
		Sub  string `json:"sub"`
		Name string `json:"name"`
	}
	if err := json.NewDecoder(io.LimitReader(res.Body, 1<<20)).Decode(&info); err != nil || info.Sub == "" {
		return "", "", ErrProviderIdentity
	}
	return info.Sub, info.Name, nil
}

func (y YouTubeAdapter) Publish(ctx context.Context, tokens TokenSet, pkg PublicationPackage) (PublishResult, error) {
	if tokens.AccessToken == "" {
		return PublishResult{}, ErrReauthRequired
	}
	if !pkg.BrandApplied {
		return PublishResult{}, ErrBrandingRequired
	}
	if strings.TrimSpace(pkg.MediaURL) == "" {
		return PublishResult{}, ErrInvalidContent
	}
	media, contentType, err := fetchMedia(ctx, y.client(), pkg.MediaURL, youtubeMaxMedia)
	if err != nil {
		return PublishResult{}, err
	}
	title := firstLine(pkg.Text)
	if title == "" {
		title = "Agbofa Nexus AI publication"
	}
	meta, err := json.Marshal(map[string]any{
		"snippet": map[string]any{
			"title":       title,
			"description": pkg.Text,
		},
		"status": map[string]any{
			"privacyStatus": "unlisted",
			"selfDeclaredMadeForKids": false,
		},
	})
	if err != nil {
		return PublishResult{}, err
	}
	initReq, err := http.NewRequestWithContext(ctx, http.MethodPost, youtubeUploadURL, bytes.NewReader(meta))
	if err != nil {
		return PublishResult{}, err
	}
	initReq.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	initReq.Header.Set("Content-Type", "application/json; charset=UTF-8")
	initReq.Header.Set("X-Upload-Content-Type", contentType)
	initReq.Header.Set("X-Upload-Content-Length", fmt.Sprintf("%d", len(media)))
	initRes, err := y.do(initReq)
	if err != nil {
		return PublishResult{}, err
	}
	io.Copy(io.Discard, io.LimitReader(initRes.Body, 1<<20))
	initRes.Body.Close()
	if initRes.StatusCode == http.StatusUnauthorized || initRes.StatusCode == http.StatusForbidden {
		return PublishResult{RawStatus: initRes.StatusCode}, ErrReauthRequired
	}
	if initRes.StatusCode >= 300 {
		return PublishResult{RawStatus: initRes.StatusCode}, fmt.Errorf("%w: platform status %d", classError(initRes.StatusCode), initRes.StatusCode)
	}
	uploadURL := initRes.Header.Get("Location")
	if uploadURL == "" {
		// Official API omitted an upload session. Do not invent a video id.
		return PublishResult{RawStatus: initRes.StatusCode}, nil
	}
	putReq, err := http.NewRequestWithContext(ctx, http.MethodPut, uploadURL, bytes.NewReader(media))
	if err != nil {
		return PublishResult{}, err
	}
	putReq.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	putReq.Header.Set("Content-Type", contentType)
	putRes, err := y.do(putReq)
	if err != nil {
		return PublishResult{}, err
	}
	defer putRes.Body.Close()
	result := PublishResult{RawStatus: putRes.StatusCode}
	if putRes.StatusCode == http.StatusUnauthorized || putRes.StatusCode == http.StatusForbidden {
		return result, ErrReauthRequired
	}
	if putRes.StatusCode >= 300 {
		return result, fmt.Errorf("%w: platform status %d", classError(putRes.StatusCode), putRes.StatusCode)
	}
	var body struct {
		ID string `json:"id"`
	}
	_ = json.NewDecoder(io.LimitReader(putRes.Body, 1<<20)).Decode(&body)
	result.ExternalID = strings.TrimSpace(body.ID)
	if result.ExternalID != "" {
		result.URL = "https://www.youtube.com/watch?v=" + result.ExternalID
	}
	return result, nil
}

func (y YouTubeAdapter) do(req *http.Request) (*http.Response, error) {
	return y.client().Do(req)
}

func (y YouTubeAdapter) client() HTTPClient {
	if y.HTTP != nil {
		return y.HTTP
	}
	return http.DefaultClient
}

func fetchMedia(ctx context.Context, client HTTPClient, raw string, max int64) ([]byte, string, error) {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme == "" || u.Host == "" {
		return nil, "", ErrInvalidContent
	}
	if u.Scheme != "https" && u.Hostname() != "localhost" && u.Hostname() != "127.0.0.1" {
		return nil, "", ErrInvalidContent
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, raw, nil)
	if err != nil {
		return nil, "", err
	}
	if client == nil {
		client = http.DefaultClient
	}
	res, err := client.Do(req)
	if err != nil {
		return nil, "", err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return nil, "", ErrInvalidContent
	}
	data, err := io.ReadAll(io.LimitReader(res.Body, max+1))
	if err != nil {
		return nil, "", err
	}
	if int64(len(data)) > max {
		return nil, "", ErrInvalidContent
	}
	ct := res.Header.Get("Content-Type")
	if ct == "" {
		ct = "video/mp4"
	}
	return data, ct, nil
}

func firstLine(s string) string {
	s = strings.TrimSpace(s)
	if i := strings.IndexAny(s, "\r\n"); i >= 0 {
		s = s[:i]
	}
	if len(s) > 100 {
		return s[:100]
	}
	return s
}

// Ensure YouTubeAdapter stays an Adapter.
var _ Adapter = YouTubeAdapter{}

// IdentifyTimeout is a default bound for provider identity calls.
var IdentifyTimeout = 15 * time.Second
