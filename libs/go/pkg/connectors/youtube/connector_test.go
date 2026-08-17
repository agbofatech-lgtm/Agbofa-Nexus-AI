package youtube

import (
"context"
"encoding/json"
"net/http"
"net/http/httptest"
"testing"
"time"

"github.com/agbofa/nexus/libs/go/pkg/connectors"
)

// mockCredStore implements connectors.CredentialStore for testing
type mockCredStore struct {
cred     *connectors.Credential
expired  bool
saveErr  error
getErr   error
}

func (m *mockCredStore) Save(ctx context.Context, cred connectors.Credential) error {
if m.saveErr != nil {
return m.saveErr
}
m.cred = &cred
return nil
}

func (m *mockCredStore) Get(ctx context.Context, tenantID, platform string) (*connectors.Credential, error) {
if m.getErr != nil {
return nil, m.getErr
}
return m.cred, nil
}

func (m *mockCredStore) Delete(ctx context.Context, tenantID, platform string) error {
m.cred = nil
return nil
}

func (m *mockCredStore) IsExpired(cred connectors.Credential) bool {
return m.expired
}

func newTestCred() *connectors.Credential {
return &connectors.Credential{
TenantID:     "test-tenant",
Platform:     PlatformName,
AccessToken:  "test-access-token",
RefreshToken: "test-refresh-token",
ExpiresAt:    time.Now().Add(1 * time.Hour),
Scopes:       []string{"https://www.googleapis.com/auth/youtube"},
}
}

func newTestConnector(server *httptest.Server) (*YouTubeConnector, *mockCredStore) {
credStore := &mockCredStore{
cred: newTestCred(),
}
conn, _ := New("test-api-key", credStore)
if server != nil {
conn.client = server.Client()
conn.SetBaseURL(server.URL)
}
return conn, credStore
}

func TestNew(t *testing.T) {
tests := []struct {
name      string
apiKey    string
credStore connectors.CredentialStore
wantErr   bool
}{
{"valid key and store", "test-key", &mockCredStore{}, false},
{"empty key", "", &mockCredStore{}, true},
{"nil store", "test-key", nil, true},
}

for _, tt := range tests {
t.Run(tt.name, func(t *testing.T) {
conn, err := New(tt.apiKey, tt.credStore)
if tt.wantErr {
if err == nil {
t.Fatal("expected error")
}
return
}
if err != nil {
t.Fatalf("unexpected error: %v", err)
}
if conn == nil {
t.Fatal("expected non-nil connector")
}
})
}
}

func TestPlatformName(t *testing.T) {
conn, _ := New("test-key", &mockCredStore{})
if got := conn.PlatformName(); got != PlatformName {
t.Errorf("PlatformName() = %q, want %q", got, PlatformName)
}
}

func TestIsConfigured(t *testing.T) {
t.Run("configured", func(t *testing.T) {
conn, _ := New("test-key", &mockCredStore{})
if !conn.IsConfigured() {
t.Error("IsConfigured() = false, want true")
}
})

t.Run("nil connector", func(t *testing.T) {
var conn *YouTubeConnector
if conn.IsConfigured() {
t.Error("IsConfigured() on nil = true, want false")
}
})
}

func TestConnect(t *testing.T) {
t.Run("valid credentials", func(t *testing.T) {
conn, _ := newTestConnector(nil)
if err := conn.Connect(context.Background(), "test-tenant"); err != nil {
t.Errorf("Connect() error = %v", err)
}
})

t.Run("expired token no refresh token", func(t *testing.T) {
conn, credStore := newTestConnector(nil)
credStore.expired = true
credStore.cred.RefreshToken = "" // No refresh token

err := conn.Connect(context.Background(), "test-tenant")
if err != connectors.ErrTokenExpired {
t.Errorf("Connect() error = %v, want %v", err, connectors.ErrTokenExpired)
}
})

t.Run("not configured", func(t *testing.T) {
conn, _ := New("test-key", &mockCredStore{cred: nil})
if err := conn.Connect(context.Background(), "test-tenant"); err != connectors.ErrNotAuthorized {
t.Errorf("Connect() error = %v, want %v", err, connectors.ErrNotAuthorized)
}
})

t.Run("no credentials", func(t *testing.T) {
conn, _ := New("test-key", &mockCredStore{cred: nil})
if err := conn.Connect(context.Background(), "test-tenant"); err != connectors.ErrNotAuthorized {
t.Errorf("Connect() error = %v, want %v", err, connectors.ErrNotAuthorized)
}
})
}

func TestPublish(t *testing.T) {
t.Run("successful publish", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
t.Errorf("expected POST, got %s", r.Method)
}
if r.Header.Get("Authorization") != "Bearer test-access-token" {
t.Error("missing or incorrect Authorization header")
}
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]any{"id": "video-123"})
}))
defer server.Close()

conn, _ := newTestConnector(server)
result, err := conn.Publish(context.Background(), "test-tenant", connectors.PublishContent{
Title:       "Test Video",
Description: "Test Description",
Visibility:  "private",
})

if err != nil {
t.Fatalf("Publish() error = %v", err)
}
if result.PlatformPostID != "video-123" {
t.Errorf("PlatformPostID = %q, want %q", result.PlatformPostID, "video-123")
}
if result.PlatformURL != "https://youtube.com/watch?v=video-123" {
t.Errorf("PlatformURL = %q", result.PlatformURL)
}
})

t.Run("publish without title", func(t *testing.T) {
conn, _ := newTestConnector(nil)
_, err := conn.Publish(context.Background(), "test-tenant", connectors.PublishContent{})
if err != connectors.ErrUnsupportedContent {
t.Errorf("Publish() error = %v, want %v", err, connectors.ErrUnsupportedContent)
}
})

t.Run("publish unauthorized", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusUnauthorized)
}))
defer server.Close()

conn, _ := newTestConnector(server)
_, err := conn.Publish(context.Background(), "test-tenant", connectors.PublishContent{
Title: "Test",
})
if err != connectors.ErrNotAuthorized {
t.Errorf("Publish() error = %v, want %v", err, connectors.ErrNotAuthorized)
}
})

t.Run("publish rate limited", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusTooManyRequests)
}))
defer server.Close()

conn, _ := newTestConnector(server)
_, err := conn.Publish(context.Background(), "test-tenant", connectors.PublishContent{
Title: "Test",
})
if err != connectors.ErrRateLimited {
t.Errorf("Publish() error = %v, want %v", err, connectors.ErrRateLimited)
}
})
}

func TestUploadVideo(t *testing.T) {
t.Run("successful upload", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
t.Errorf("expected POST, got %s", r.Method)
}
if err := r.ParseMultipartForm(10 << 20); err != nil {
t.Errorf("ParseMultipartForm error = %v", err)
}
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]any{"id": "uploaded-video-123"})
}))
defer server.Close()

conn, _ := newTestConnector(server)
result, err := conn.UploadVideo(
context.Background(),
"test-tenant",
connectors.PublishContent{Title: "Upload Test", Visibility: "private"},
[]byte("fake video data"),
"test.mp4",
)

if err != nil {
t.Fatalf("UploadVideo() error = %v", err)
}
if result.PlatformPostID != "uploaded-video-123" {
t.Errorf("PlatformPostID = %q", result.PlatformPostID)
}
})

t.Run("upload without video data", func(t *testing.T) {
conn, _ := newTestConnector(nil)
_, err := conn.UploadVideo(
context.Background(),
"test-tenant",
connectors.PublishContent{Title: "Test"},
nil,
"test.mp4",
)
if err != connectors.ErrUnsupportedContent {
t.Errorf("UploadVideo() error = %v, want %v", err, connectors.ErrUnsupportedContent)
}
})
}

func TestCreatePlaylist(t *testing.T) {
t.Run("successful playlist creation", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
t.Errorf("expected POST, got %s", r.Method)
}
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]any{"id": "playlist-123"})
}))
defer server.Close()

conn, _ := newTestConnector(server)
id, err := conn.CreatePlaylist(context.Background(), "test-tenant", "My Playlist", "Description", "private")

if err != nil {
t.Fatalf("CreatePlaylist() error = %v", err)
}
if id != "playlist-123" {
t.Errorf("CreatePlaylist() = %q, want %q", id, "playlist-123")
}
})

t.Run("playlist without title", func(t *testing.T) {
conn, _ := newTestConnector(nil)
_, err := conn.CreatePlaylist(context.Background(), "test-tenant", "", "", "")
if err != connectors.ErrUnsupportedContent {
t.Errorf("CreatePlaylist() error = %v, want %v", err, connectors.ErrUnsupportedContent)
}
})
}

func TestAddToPlaylist(t *testing.T) {
t.Run("successful add", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodPost {
t.Errorf("expected POST, got %s", r.Method)
}
w.WriteHeader(http.StatusOK)
}))
defer server.Close()

conn, _ := newTestConnector(server)
if err := conn.AddToPlaylist(context.Background(), "test-tenant", "playlist-123", "video-456"); err != nil {
t.Errorf("AddToPlaylist() error = %v", err)
}
})

t.Run("invalid IDs", func(t *testing.T) {
conn, _ := newTestConnector(nil)
if err := conn.AddToPlaylist(context.Background(), "test-tenant", "", ""); err != ErrInvalidVideoID {
t.Errorf("AddToPlaylist() error = %v, want %v", err, ErrInvalidVideoID)
}
})
}

func TestGetStatus(t *testing.T) {
t.Run("successful status", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]any{
"items": []map[string]any{
{
"status": map[string]any{"privacyStatus": "public"},
"statistics": map[string]any{
"viewCount":    "1000",
"likeCount":    "50",
"commentCount": "10",
},
},
},
})
}))
defer server.Close()

conn, _ := newTestConnector(server)
status, err := conn.GetStatus(context.Background(), "test-tenant", "video-123")

if err != nil {
t.Fatalf("GetStatus() error = %v", err)
}
if status.Views != 1000 {
t.Errorf("Views = %d, want 1000", status.Views)
}
if status.Likes != 50 {
t.Errorf("Likes = %d, want 50", status.Likes)
}
if status.Comments != 10 {
t.Errorf("Comments = %d, want 10", status.Comments)
}
})

t.Run("invalid video ID", func(t *testing.T) {
conn, _ := newTestConnector(nil)
_, err := conn.GetStatus(context.Background(), "test-tenant", "")
if err != ErrInvalidVideoID {
t.Errorf("GetStatus() error = %v, want %v", err, ErrInvalidVideoID)
}
})

t.Run("video not found", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]any{"items": []map[string]any{}})
}))
defer server.Close()

conn, _ := newTestConnector(server)
_, err := conn.GetStatus(context.Background(), "test-tenant", "nonexistent")
if err != ErrInvalidVideoID {
t.Errorf("GetStatus() error = %v, want %v", err, ErrInvalidVideoID)
}
})
}

func TestDelete(t *testing.T) {
t.Run("successful delete", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
if r.Method != http.MethodDelete {
t.Errorf("expected DELETE, got %s", r.Method)
}
w.WriteHeader(http.StatusNoContent)
}))
defer server.Close()

conn, _ := newTestConnector(server)
if err := conn.Delete(context.Background(), "test-tenant", "video-123"); err != nil {
t.Errorf("Delete() error = %v", err)
}
})

t.Run("delete unauthorized", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.WriteHeader(http.StatusUnauthorized)
}))
defer server.Close()

conn, _ := newTestConnector(server)
if err := conn.Delete(context.Background(), "test-tenant", "video-123"); err != connectors.ErrNotAuthorized {
t.Errorf("Delete() error = %v, want %v", err, connectors.ErrNotAuthorized)
}
})
}

func TestGetAnalytics(t *testing.T) {
t.Run("successful analytics", func(t *testing.T) {
server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusOK)
json.NewEncoder(w).Encode(map[string]any{
"items": []map[string]any{
{
"status": map[string]any{"privacyStatus": "public"},
"statistics": map[string]any{
"viewCount":    "5000",
"likeCount":    "200",
"commentCount": "30",
},
},
},
})
}))
defer server.Close()

conn, _ := newTestConnector(server)
analytics, err := conn.GetAnalytics(context.Background(), "test-tenant", "video-123")

if err != nil {
t.Fatalf("GetAnalytics() error = %v", err)
}
if analytics.Views != 5000 {
t.Errorf("Views = %d, want 5000", analytics.Views)
}
if analytics.Likes != 200 {
t.Errorf("Likes = %d, want 200", analytics.Likes)
}
})
}

func TestParseCount(t *testing.T) {
tests := []struct {
input string
want  int64
}{
{"100", 100},
{"0", 0},
{"", 0},
{"invalid", 0},
{"999999999", 999999999},
}

for _, tt := range tests {
t.Run(tt.input, func(t *testing.T) {
if got := parseCount(tt.input); got != tt.want {
t.Errorf("parseCount(%q) = %d, want %d", tt.input, got, tt.want)
}
})
}
}
