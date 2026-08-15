package youtube

import (
"context"
"encoding/json"
"fmt"
"net/http"
"net/url"
"strings"
"time"

"github.com/agbofa/nexus/libs/go/pkg/connectors"
)

// OAuthManager handles YouTube OAuth 2.0 flow.
type OAuthManager struct {
config     *Config
httpClient *http.Client
}

// NewOAuthManager creates an OAuth manager.
func NewOAuthManager(config *Config) *OAuthManager {
return &OAuthManager{
config:     config,
httpClient: &http.Client{Timeout: 30 * time.Second},
}
}

// GetAuthURL generates the OAuth authorization URL.
func (m *OAuthManager) GetAuthURL(state string) string {
params := url.Values{}
params.Set("client_id", m.config.ClientID)
params.Set("redirect_uri", m.config.RedirectURI)
params.Set("response_type", "code")
params.Set("scope", "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube")
params.Set("access_type", "offline")
params.Set("include_granted_scopes", "true")
params.Set("state", state)

return "https://accounts.google.com/o/oauth2/v2/auth?" + params.Encode()
}

// ExchangeCode exchanges an authorization code for tokens.
func (m *OAuthManager) ExchangeCode(ctx context.Context, code string) (*connectors.Credential, error) {
data := url.Values{}
data.Set("code", code)
data.Set("client_id", m.config.ClientID)
data.Set("client_secret", m.config.ClientSecret)
data.Set("redirect_uri", m.config.RedirectURI)
data.Set("grant_type", "authorization_code")

req, err := http.NewRequestWithContext(ctx, http.MethodPost,
"https://oauth2.googleapis.com/token",
strings.NewReader(data.Encode()))
if err != nil {
return nil, err
}
req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

resp, err := m.httpClient.Do(req)
if err != nil {
return nil, err
}
defer resp.Body.Close()

if resp.StatusCode != http.StatusOK {
return nil, fmt.Errorf("OAuth exchange failed with status %d", resp.StatusCode)
}

var tokenResp struct {
AccessToken  string `json:"access_token"`
ExpiresIn    int    `json:"expires_in"`
RefreshToken string `json:"refresh_token"`
Scope        string `json:"scope"`
TokenType    string `json:"token_type"`
}

if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
return nil, err
}

return &connectors.Credential{
AccessToken:  tokenResp.AccessToken,
RefreshToken: tokenResp.RefreshToken,
ExpiresAt:    time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second),
Scopes:       strings.Split(tokenResp.Scope, " "),
}, nil
}

// RefreshToken refreshes an expired access token.
func (m *OAuthManager) RefreshToken(ctx context.Context, refreshToken string) (*connectors.Credential, error) {
data := url.Values{}
data.Set("refresh_token", refreshToken)
data.Set("client_id", m.config.ClientID)
data.Set("client_secret", m.config.ClientSecret)
data.Set("grant_type", "refresh_token")

req, err := http.NewRequestWithContext(ctx, http.MethodPost,
"https://oauth2.googleapis.com/token",
strings.NewReader(data.Encode()))
if err != nil {
return nil, err
}
req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

resp, err := m.httpClient.Do(req)
if err != nil {
return nil, err
}
defer resp.Body.Close()

if resp.StatusCode != http.StatusOK {
return nil, fmt.Errorf("token refresh failed with status %d", resp.StatusCode)
}

var tokenResp struct {
AccessToken string `json:"access_token"`
ExpiresIn   int    `json:"expires_in"`
Scope       string `json:"scope"`
TokenType   string `json:"token_type"`
}

if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
return nil, err
}

return &connectors.Credential{
AccessToken:  tokenResp.AccessToken,
RefreshToken: refreshToken,
ExpiresAt:    time.Now().Add(time.Duration(tokenResp.ExpiresIn) * time.Second),
Scopes:       strings.Split(tokenResp.Scope, " "),
}, nil
}
