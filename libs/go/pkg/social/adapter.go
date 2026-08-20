package social

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"
)

type TokenSet struct {
	AccessToken  string
	RefreshToken string
	ExpiresAt    time.Time
	Scopes       []string
	AccountID    string
	AccountName  string
}

type PublishResult struct {
	ExternalID string
	URL        string
	RawStatus  int
}

// Adapter talks to one official platform. It must not invent publication IDs.
type Adapter interface {
	Platform() Platform
	Exchange(ctx context.Context, code, redirect, verifier string) (TokenSet, error)
	Refresh(ctx context.Context, refreshToken string) (TokenSet, error)
	Publish(ctx context.Context, tokens TokenSet, pkg PublicationPackage) (PublishResult, error)
}

type HTTPClient interface {
	Do(*http.Request) (*http.Response, error)
}

type OAuthClient struct {
	Spec       Spec
	ClientID   string
	ClientSec  string
	HTTP       HTTPClient
	PublishURL string
}

func (c OAuthClient) Platform() Platform { return c.Spec.ID }

func (c OAuthClient) Exchange(ctx context.Context, code, redirect, verifier string) (TokenSet, error) {
	if c.ClientID == "" || code == "" {
		return TokenSet{}, ErrTokenUnavailable
	}
	form := url.Values{
		"grant_type": {"authorization_code"}, "code": {code},
		"redirect_uri": {redirect}, "client_id": {c.ClientID},
	}
	if c.ClientSec != "" {
		form.Set("client_secret", c.ClientSec)
	}
	if c.Spec.PKCE && verifier != "" {
		form.Set("code_verifier", verifier)
	}
	return c.token(ctx, form)
}

func (c OAuthClient) Refresh(ctx context.Context, refreshToken string) (TokenSet, error) {
	if refreshToken == "" || c.ClientID == "" {
		return TokenSet{}, ErrReauthRequired
	}
	form := url.Values{"grant_type": {"refresh_token"}, "refresh_token": {refreshToken}, "client_id": {c.ClientID}}
	if c.ClientSec != "" {
		form.Set("client_secret", c.ClientSec)
	}
	return c.token(ctx, form)
}

func (c OAuthClient) Publish(ctx context.Context, tokens TokenSet, pkg PublicationPackage) (PublishResult, error) {
	if tokens.AccessToken == "" {
		return PublishResult{}, ErrReauthRequired
	}
	if !pkg.BrandApplied {
		return PublishResult{}, ErrBrandingRequired
	}
	if c.PublishURL == "" {
		return PublishResult{}, ErrCapabilityUnsupported
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.PublishURL, strings.NewReader(pkg.Text))
	if err != nil {
		return PublishResult{}, err
	}
	req.Header.Set("Authorization", "Bearer "+tokens.AccessToken)
	req.Header.Set("Content-Type", "text/plain; charset=utf-8")
	client := c.HTTP
	if client == nil {
		client = http.DefaultClient
	}
	res, err := client.Do(req)
	if err != nil {
		return PublishResult{}, err
	}
	defer res.Body.Close()
	if res.StatusCode == http.StatusUnauthorized || res.StatusCode == http.StatusForbidden {
		return PublishResult{RawStatus: res.StatusCode}, ErrReauthRequired
	}
	if res.StatusCode >= 300 {
		return PublishResult{RawStatus: res.StatusCode}, fmt.Errorf("%w: platform status %d", classError(res.StatusCode), res.StatusCode)
	}
	return PublishResult{RawStatus: res.StatusCode, ExternalID: strings.TrimSpace(res.Header.Get("X-Publication-Id"))}, nil
}

func (c OAuthClient) token(ctx context.Context, form url.Values) (TokenSet, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.Spec.TokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return TokenSet{}, err
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	client := c.HTTP
	if client == nil {
		client = http.DefaultClient
	}
	res, err := client.Do(req)
	if err != nil {
		return TokenSet{}, err
	}
	defer res.Body.Close()
	if res.StatusCode >= 300 {
		return TokenSet{}, ErrReauthRequired
	}
	var parsed struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
		ExpiresIn    int    `json:"expires_in"`
		Scope        string `json:"scope"`
	}
	if err := json.NewDecoder(res.Body).Decode(&parsed); err != nil || parsed.AccessToken == "" {
		return TokenSet{}, ErrTokenUnavailable
	}
	exp := time.Time{}
	if parsed.ExpiresIn > 0 {
		exp = time.Now().UTC().Add(time.Duration(parsed.ExpiresIn) * time.Second)
	}
	return TokenSet{
		AccessToken: parsed.AccessToken, RefreshToken: parsed.RefreshToken,
		ExpiresAt: exp, Scopes: strings.Fields(parsed.Scope),
	}, nil
}

func classError(status int) error {
	switch ClassifyHTTP(status) {
	case FailAuthentication:
		return ErrReauthRequired
	case FailRateLimit:
		return ErrNotRetryable
	default:
		return fmt.Errorf("social: platform http %d", status)
	}
}
