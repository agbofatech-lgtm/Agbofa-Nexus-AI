// Package youtube implements the YouTube connector for the Distribution Engine.
//
// Uses the YouTube Data API v3 for publishing, status tracking, and analytics.
// API key from YOUTUBE_API_KEY environment variable.
// OAuth tokens from the CredentialStore.
//
// IMP-DISTRIBUTION-001
package youtube

import (
"bytes"
"context"
"encoding/json"
"errors"
"fmt"
"io"
"mime/multipart"
"net/http"
"net/url"
"os"
"strconv"
"strings"
"time"

"github.com/agbofa/nexus/libs/go/pkg/connectors"
)

const (
PlatformName = "youtube"
apiBaseURL   = "https://www.googleapis.com/youtube/v3"
uploadURL    = "https://www.googleapis.com/upload/youtube/v3/videos"
)

var (
ErrMissingAPIKey  = errors.New("youtube api key is required")
ErrNotConnected   = errors.New("youtube not connected for tenant")
ErrInvalidVideoID = errors.New("invalid youtube video id")
ErrNoRefreshToken = errors.New("youtube refresh token is required for token refresh")
)

// YouTubeConnector implements PlatformConnector for YouTube.
type YouTubeConnector struct {
apiKey    string
baseURL   string
client    *http.Client
credStore connectors.CredentialStore
}

// New creates a YouTubeConnector with API key and credential store.
func New(apiKey string, credStore connectors.CredentialStore) (*YouTubeConnector, error) {
if apiKey == "" {
return nil, ErrMissingAPIKey
}
if credStore == nil {
return nil, errors.New("credential store is required")
}
return &YouTubeConnector{
apiKey:    apiKey,
baseURL:   apiBaseURL,
client:    &http.Client{Timeout: 60 * time.Second},
credStore: credStore,
}, nil
}

// NewFromEnv creates from YOUTUBE_API_KEY and a credential store.
func NewFromEnv(credStore connectors.CredentialStore) (*YouTubeConnector, error) {
return New(strings.TrimSpace(os.Getenv("YOUTUBE_API_KEY")), credStore)
}

func (y *YouTubeConnector) SetBaseURL(baseURL string) {
y.baseURL = strings.TrimRight(baseURL, "/")
}

func (y *YouTubeConnector) PlatformName() string { return PlatformName }

func (y *YouTubeConnector) IsConfigured() bool {
if y == nil {
return false
}
return y.apiKey != "" && y.credStore != nil
}

func (y *YouTubeConnector) Connect(ctx context.Context, tenantID string) error {
if !y.IsConfigured() {
return connectors.ErrNotConfigured
}
cred, err := y.credStore.Get(ctx, tenantID, PlatformName)
if err != nil {
return fmt.Errorf("get youtube credentials: %w", err)
}
if cred == nil {
return connectors.ErrNotAuthorized
}
if y.credStore.IsExpired(*cred) {
// Attempt token refresh if refresh token exists
if cred.RefreshToken != "" {
newCred, err := y.refreshToken(ctx, *cred)
if err != nil {
return fmt.Errorf("refresh youtube token: %w", err)
}
if err := y.credStore.Save(ctx, newCred); err != nil {
return fmt.Errorf("save refreshed youtube token: %w", err)
}
return nil
}
return connectors.ErrTokenExpired
}
return nil
}

// refreshToken refreshes an expired OAuth token using the refresh token.
func (y *YouTubeConnector) refreshToken(ctx context.Context, cred connectors.Credential) (connectors.Credential, error) {
if cred.RefreshToken == "" {
return cred, ErrNoRefreshToken
}

data := url.Values{}
data.Set("client_id", os.Getenv("YOUTUBE_CLIENT_ID"))
data.Set("client_secret", os.Getenv("YOUTUBE_CLIENT_SECRET"))
data.Set("refresh_token", cred.RefreshToken)
data.Set("grant_type", "refresh_token")

httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
"https://oauth2.googleapis.com/token",
strings.NewReader(data.Encode()))
if err != nil {
return cred, err
}
httpReq.Header.Set("Content-Type", "application/x-www-form-urlencoded")

resp, err := y.client.Do(httpReq)
if err != nil {
return cred, err
}
defer resp.Body.Close()

if resp.StatusCode != http.StatusOK {
body, _ := io.ReadAll(io.LimitReader(resp.Body, 1024))
return cred, fmt.Errorf("token refresh failed with status %d: %s", resp.StatusCode, string(body))
}

var tokenResp struct {
AccessToken  string `json:"access_token"`
ExpiresIn    int    `json:"expires_in"`
RefreshToken string `json:"refresh_token"`
Scope        string `json:"scope"`
TokenType    string `json:"token_type"`
}
if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
return cred, err
}

cred.AccessToken = tokenResp.AccessToken
cred.ExpiresAt = time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second)
if tokenResp.RefreshToken != "" {
cred.RefreshToken = tokenResp.RefreshToken
}

return cred, nil
}

// Publish creates a new video metadata entry (for URL-based videos).
// For actual file upload, use UploadVideo.
func (y *YouTubeConnector) Publish(ctx context.Context, tenantID string, content connectors.PublishContent) (connectors.PublishResult, error) {
if err := y.Connect(ctx, tenantID); err != nil {
return connectors.PublishResult{}, err
}
if content.Title == "" {
return connectors.PublishResult{}, connectors.ErrUnsupportedContent
}

cred, _ := y.credStore.Get(ctx, tenantID, PlatformName)

video := map[string]any{
"snippet": map[string]any{
"title":       content.Title,
"description": content.Description,
"tags":        content.Tags,
"categoryId":  content.CategoryID,
},
"status": map[string]any{
"privacyStatus": content.Visibility,
},
}
if content.Visibility == "" {
video["status"].(map[string]any)["privacyStatus"] = "private"
}

body, _ := json.Marshal(video)

httpReq, _ := http.NewRequestWithContext(ctx, http.MethodPost,
y.baseURL+"/videos?part=snippet,status&key="+y.apiKey,
bytes.NewReader(body))
httpReq.Header.Set("Content-Type", "application/json")
httpReq.Header.Set("Authorization", "Bearer "+cred.AccessToken)

resp, err := y.client.Do(httpReq)
if err != nil {
return connectors.PublishResult{}, fmt.Errorf("%w: %v", connectors.ErrPlatformUnavailable, err)
}
defer resp.Body.Close()

respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<20))

if resp.StatusCode == http.StatusUnauthorized {
return connectors.PublishResult{}, connectors.ErrNotAuthorized
}
if resp.StatusCode == http.StatusTooManyRequests {
return connectors.PublishResult{}, connectors.ErrRateLimited
}
if resp.StatusCode >= 300 {
return connectors.PublishResult{}, fmt.Errorf("youtube publish failed with status %d: %s", resp.StatusCode, truncate(string(respBody), 200))
}

var result struct {
ID string `json:"id"`
}
if err := json.Unmarshal(respBody, &result); err != nil {
return connectors.PublishResult{}, fmt.Errorf("unmarshal youtube response: %w", err)
}

return connectors.PublishResult{
PlatformPostID: result.ID,
PlatformURL:    "https://youtube.com/watch?v=" + result.ID,
PublishedAt:    time.Now().UTC(),
Status:         "published",
}, nil
}

// UploadVideo uploads a video file to YouTube with multipart upload.
func (y *YouTubeConnector) UploadVideo(ctx context.Context, tenantID string, content connectors.PublishContent, videoData []byte, filename string) (connectors.PublishResult, error) {
if err := y.Connect(ctx, tenantID); err != nil {
return connectors.PublishResult{}, err
}
if content.Title == "" || len(videoData) == 0 {
return connectors.PublishResult{}, connectors.ErrUnsupportedContent
}

cred, _ := y.credStore.Get(ctx, tenantID, PlatformName)

// Create multipart form
var buf bytes.Buffer
writer := multipart.NewWriter(&buf)

// Metadata part
metadata := map[string]any{
"snippet": map[string]any{
"title":       content.Title,
"description": content.Description,
"tags":        content.Tags,
"categoryId":  content.CategoryID,
},
"status": map[string]any{
"privacyStatus": content.Visibility,
},
}
if content.Visibility == "" {
metadata["status"].(map[string]any)["privacyStatus"] = "private"
}

metaJSON, _ := json.Marshal(metadata)
metaPart, _ := writer.CreateFormField("snippet")
metaPart.Write(metaJSON)

// Video file part
videoPart, _ := writer.CreateFormFile("video", filename)
videoPart.Write(videoData)

writer.Close()

// Create upload request
httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost,
y.baseURL+"/videos?uploadType=multipart&part=snippet,status&key="+y.apiKey,
&buf)
if err != nil {
return connectors.PublishResult{}, err
}
httpReq.Header.Set("Content-Type", writer.FormDataContentType())
httpReq.Header.Set("Authorization", "Bearer "+cred.AccessToken)

resp, err := y.client.Do(httpReq)
if err != nil {
return connectors.PublishResult{}, fmt.Errorf("%w: %v", connectors.ErrPlatformUnavailable, err)
}
defer resp.Body.Close()

respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<20))

if resp.StatusCode == http.StatusUnauthorized {
return connectors.PublishResult{}, connectors.ErrNotAuthorized
}
if resp.StatusCode == http.StatusTooManyRequests {
return connectors.PublishResult{}, connectors.ErrRateLimited
}
if resp.StatusCode >= 300 {
return connectors.PublishResult{}, fmt.Errorf("youtube upload failed with status %d: %s", resp.StatusCode, truncate(string(respBody), 200))
}

var result struct {
ID string `json:"id"`
}
if err := json.Unmarshal(respBody, &result); err != nil {
return connectors.PublishResult{}, fmt.Errorf("unmarshal youtube upload response: %w", err)
}

return connectors.PublishResult{
PlatformPostID: result.ID,
PlatformURL:    "https://youtube.com/watch?v=" + result.ID,
PublishedAt:    time.Now().UTC(),
Status:         "uploaded",
}, nil
}

// CreatePlaylist creates a new playlist for the authenticated user.
func (y *YouTubeConnector) CreatePlaylist(ctx context.Context, tenantID, title, description, privacyStatus string) (string, error) {
if err := y.Connect(ctx, tenantID); err != nil {
return "", err
}
if title == "" {
return "", connectors.ErrUnsupportedContent
}

cred, _ := y.credStore.Get(ctx, tenantID, PlatformName)

if privacyStatus == "" {
privacyStatus = "private"
}

playlist := map[string]any{
"snippet": map[string]any{
"title":       title,
"description": description,
},
"status": map[string]any{
"privacyStatus": privacyStatus,
},
}

body, _ := json.Marshal(playlist)

httpReq, _ := http.NewRequestWithContext(ctx, http.MethodPost,
y.baseURL+"/playlists?part=snippet,status&key="+y.apiKey,
bytes.NewReader(body))
httpReq.Header.Set("Content-Type", "application/json")
httpReq.Header.Set("Authorization", "Bearer "+cred.AccessToken)

resp, err := y.client.Do(httpReq)
if err != nil {
return "", err
}
defer resp.Body.Close()

respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<20))

if resp.StatusCode == http.StatusUnauthorized {
return "", connectors.ErrNotAuthorized
}
if resp.StatusCode >= 300 {
return "", fmt.Errorf("youtube create playlist failed with status %d", resp.StatusCode)
}

var result struct {
ID string `json:"id"`
}
if err := json.Unmarshal(respBody, &result); err != nil {
return "", err
}

return result.ID, nil
}

// AddToPlaylist adds a video to an existing playlist.
func (y *YouTubeConnector) AddToPlaylist(ctx context.Context, tenantID, playlistID, videoID string) error {
if err := y.Connect(ctx, tenantID); err != nil {
return err
}
if playlistID == "" || videoID == "" {
return ErrInvalidVideoID
}

cred, _ := y.credStore.Get(ctx, tenantID, PlatformName)

item := map[string]any{
"snippet": map[string]any{
"playlistId": playlistID,
"resourceId": map[string]any{
"kind":    "youtube#video",
"videoId": videoID,
},
},
}

body, _ := json.Marshal(item)

httpReq, _ := http.NewRequestWithContext(ctx, http.MethodPost,
y.baseURL+"/playlistItems?part=snippet&key="+y.apiKey,
bytes.NewReader(body))
httpReq.Header.Set("Content-Type", "application/json")
httpReq.Header.Set("Authorization", "Bearer "+cred.AccessToken)

resp, err := y.client.Do(httpReq)
if err != nil {
return err
}
defer resp.Body.Close()

if resp.StatusCode == http.StatusUnauthorized {
return connectors.ErrNotAuthorized
}
if resp.StatusCode >= 300 {
return fmt.Errorf("youtube add to playlist failed with status %d", resp.StatusCode)
}

return nil
}

// GetChannelInfo retrieves the authenticated user's channel information.
func (y *YouTubeConnector) GetChannelInfo(ctx context.Context, tenantID string) (map[string]any, error) {
if err := y.Connect(ctx, tenantID); err != nil {
return nil, err
}

cred, _ := y.credStore.Get(ctx, tenantID, PlatformName)

httpReq, _ := http.NewRequestWithContext(ctx, http.MethodGet,
y.baseURL+"/channels?part=snippet,statistics&mine=true&key="+y.apiKey,
nil)
httpReq.Header.Set("Authorization", "Bearer "+cred.AccessToken)

resp, err := y.client.Do(httpReq)
if err != nil {
return nil, err
}
defer resp.Body.Close()

if resp.StatusCode == http.StatusUnauthorized {
return nil, connectors.ErrNotAuthorized
}
if resp.StatusCode >= 300 {
return nil, fmt.Errorf("youtube get channel info failed with status %d", resp.StatusCode)
}

var result map[string]any
if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
return nil, err
}

return result, nil
}

// GetStatus retrieves the current status of a video.
func (y *YouTubeConnector) GetStatus(ctx context.Context, tenantID, platformPostID string) (connectors.PostStatus, error) {
if platformPostID == "" {
return connectors.PostStatus{}, ErrInvalidVideoID
}
if err := y.Connect(ctx, tenantID); err != nil {
return connectors.PostStatus{}, err
}

httpReq, _ := http.NewRequestWithContext(ctx, http.MethodGet,
y.baseURL+"/videos?part=status,statistics&id="+platformPostID+"&key="+y.apiKey,
nil)

resp, err := y.client.Do(httpReq)
if err != nil {
return connectors.PostStatus{}, err
}
defer resp.Body.Close()

respBody, _ := io.ReadAll(io.LimitReader(resp.Body, 4<<20))

var result struct {
Items []struct {
Status struct {
PrivacyStatus string `json:"privacyStatus"`
} `json:"status"`
Statistics struct {
ViewCount    string `json:"viewCount"`
LikeCount    string `json:"likeCount"`
CommentCount string `json:"commentCount"`
} `json:"statistics"`
} `json:"items"`
}
if err := json.Unmarshal(respBody, &result); err != nil {
return connectors.PostStatus{}, err
}
if len(result.Items) == 0 {
return connectors.PostStatus{}, ErrInvalidVideoID
}

item := result.Items[0]
return connectors.PostStatus{
PlatformPostID: platformPostID,
Status:         item.Status.PrivacyStatus,
Views:          parseCount(item.Statistics.ViewCount),
Likes:          parseCount(item.Statistics.LikeCount),
Comments:       parseCount(item.Statistics.CommentCount),
LastCheckedAt:  time.Now().UTC(),
}, nil
}

// Delete removes a video from YouTube.
func (y *YouTubeConnector) Delete(ctx context.Context, tenantID, platformPostID string) error {
if err := y.Connect(ctx, tenantID); err != nil {
return err
}
cred, _ := y.credStore.Get(ctx, tenantID, PlatformName)

httpReq, _ := http.NewRequestWithContext(ctx, http.MethodDelete,
y.baseURL+"/videos?id="+platformPostID+"&key="+y.apiKey,
nil)
httpReq.Header.Set("Authorization", "Bearer "+cred.AccessToken)

resp, err := y.client.Do(httpReq)
if err != nil {
return err
}
defer resp.Body.Close()

if resp.StatusCode == http.StatusNoContent || resp.StatusCode == http.StatusOK {
return nil
}
if resp.StatusCode == http.StatusUnauthorized {
return connectors.ErrNotAuthorized
}
return fmt.Errorf("youtube delete failed with status %d", resp.StatusCode)
}

// GetAnalytics retrieves analytics for a video.
func (y *YouTubeConnector) GetAnalytics(ctx context.Context, tenantID, platformPostID string) (connectors.PostAnalytics, error) {
status, err := y.GetStatus(ctx, tenantID, platformPostID)
if err != nil {
return connectors.PostAnalytics{}, err
}
return connectors.PostAnalytics{
PlatformPostID: platformPostID,
Views:          status.Views,
Likes:          status.Likes,
Comments:       status.Comments,
CollectedAt:    time.Now().UTC(),
}, nil
}

// Helper functions
func parseCount(s string) int64 {
if s == "" {
return 0
}
n, _ := strconv.ParseInt(s, 10, 64)
return n
}

func truncate(s string, maxLen int) string {
if len(s) <= maxLen {
return s
}
return s[:maxLen]
}
