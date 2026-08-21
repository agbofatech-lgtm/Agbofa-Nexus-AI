package social

import (
	"context"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) Do(r *http.Request) (*http.Response, error) { return f(r) }

func TestYouTubePublishDoesNotInventID(t *testing.T) {
	adapter := YouTubeAdapter{OAuthClient: OAuthClient{
		Spec: func() Spec { s, _ := Lookup("youtube"); return s }(),
		HTTP: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			if strings.Contains(r.URL.Path, "/upload/") {
				return &http.Response{
					StatusCode: 200,
					Header:     http.Header{},
					Body:       io.NopCloser(strings.NewReader(`{"kind":"youtube#video"}`)),
					Request:    r,
				}, nil
			}
			return &http.Response{StatusCode: 200, Header: http.Header{"Content-Type": []string{"video/mp4"}}, Body: io.NopCloser(strings.NewReader("fake-bytes")), Request: r}, nil
		}),
	}}
	media := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.Header().Set("Content-Type", "video/mp4")
		_, _ = w.Write([]byte("not-a-real-video"))
	}))
	defer media.Close()
	res, err := adapter.Publish(context.Background(), TokenSet{AccessToken: "tok"}, PublicationPackage{
		Platform: PlatformYouTube, Text: "hello — Agbofa Nexus AI", BrandApplied: true, MediaURL: media.URL,
	})
	if err != nil {
		t.Fatal(err)
	}
	if res.ExternalID != "" {
		t.Fatalf("must not invent a video id, got %q", res.ExternalID)
	}
}

func TestYouTubePublishRequiresMediaAndBrand(t *testing.T) {
	y := NewYouTubeAdapter(nil)
	if _, err := y.Publish(context.Background(), TokenSet{AccessToken: "t"}, PublicationPackage{BrandApplied: true}); err != ErrInvalidContent {
		t.Fatalf("media: %v", err)
	}
	if _, err := y.Publish(context.Background(), TokenSet{AccessToken: "t"}, PublicationPackage{BrandApplied: false, MediaURL: "https://example.invalid/v.mp4"}); err != ErrBrandingRequired {
		t.Fatalf("brand: %v", err)
	}
}

func TestYouTubeIdentifyRequiresChannel(t *testing.T) {
	y := YouTubeAdapter{OAuthClient: OAuthClient{HTTP: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		body := `{"items":[]}`
		if strings.Contains(r.URL.Path, "userinfo") {
			body = `{}`
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}, Request: r}, nil
	})}}
	if _, _, err := y.Identify(context.Background(), TokenSet{AccessToken: "t"}); err != ErrProviderIdentity {
		t.Fatalf("identify: %v", err)
	}
}

func TestYouTubeIdentifyFallsBackToUserInfo(t *testing.T) {
	y := YouTubeAdapter{OAuthClient: OAuthClient{HTTP: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		body := `{"items":[]}`
		if strings.Contains(r.URL.Path, "userinfo") {
			body = `{"sub":"google-sub-1","name":"Test User"}`
		}
		return &http.Response{StatusCode: 200, Body: io.NopCloser(strings.NewReader(body)), Header: http.Header{}, Request: r}, nil
	})}}
	id, name, err := y.Identify(context.Background(), TokenSet{AccessToken: "t"})
	if err != nil || id != "google-sub-1" || name != "Test User" {
		t.Fatalf("fallback: %s %s %v", id, name, err)
	}
}
