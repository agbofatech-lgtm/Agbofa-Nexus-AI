package social

import "testing"

func TestCredentialNamesPreferSecretContract(t *testing.T) {
	t.Setenv("AGBOFA_SECRET_SOCIAL_YOUTUBE_CLIENT_ID", "from-secret")
	t.Setenv("AGBOFA_OAUTH_YOUTUBE_CLIENT_ID", "from-oauth")
	if ClientID(PlatformYouTube) != "from-secret" {
		t.Fatalf("got %q", ClientID(PlatformYouTube))
	}
	t.Setenv("AGBOFA_SECRET_SOCIAL_YOUTUBE_CLIENT_ID", "")
	if ClientID(PlatformYouTube) != "from-oauth" {
		t.Fatalf("fallback got %q", ClientID(PlatformYouTube))
	}
	t.Setenv("AGBOFA_SOCIAL_YOUTUBE_REDIRECT_URI", "http://localhost:3000/api/v1/social/callback")
	if RedirectURI(PlatformYouTube) != "http://localhost:3000/api/v1/social/callback" {
		t.Fatal("redirect")
	}
	if err := RedirectAllowed(PlatformYouTube, "https://evil.example/cb"); err != ErrInvalidRedirect {
		t.Fatalf("allowlist: %v", err)
	}
}
