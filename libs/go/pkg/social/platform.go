package social

import "strings"

type Platform string

const (
	PlatformX        Platform = "x"
	PlatformLinkedIn Platform = "linkedin"
	PlatformMeta     Platform = "meta"
)

type Capability string

const (
	CapabilityText       Capability = "PLATFORM_CAPABILITY_TEXT"
	CapabilityImage      Capability = "PLATFORM_CAPABILITY_IMAGE"
	CapabilityVideo      Capability = "PLATFORM_CAPABILITY_VIDEO"
	CapabilityLink       Capability = "PLATFORM_CAPABILITY_LINK"
	CapabilityScheduling Capability = "PLATFORM_CAPABILITY_SCHEDULING"
	CapabilityDelete     Capability = "PLATFORM_CAPABILITY_DELETE"
	CapabilityAnalytics  Capability = "PLATFORM_CAPABILITY_ANALYTICS"
)

type Spec struct {
	ID           Platform
	DisplayName  string
	OAuthKind    string
	AuthURL      string
	TokenURL     string
	Scopes       []string
	Capabilities []Capability
	MaxText      int
	PKCE         bool
	Docs         string
}

func Catalog() map[Platform]Spec {
	return map[Platform]Spec{
		PlatformX: {
			ID: PlatformX, DisplayName: "X", OAuthKind: "oauth2_pkce",
			AuthURL: "https://twitter.com/i/oauth2/authorize", TokenURL: "https://api.twitter.com/2/oauth2/token",
			Scopes:       []string{"tweet.read", "tweet.write", "users.read", "offline.access"},
			Capabilities: []Capability{CapabilityText, CapabilityImage, CapabilityLink, CapabilityDelete},
			MaxText:      280, PKCE: true,
			Docs: "https://docs.x.com/fundamentals/authentication/oauth-2-0/authorization-code",
		},
		PlatformLinkedIn: {
			ID: PlatformLinkedIn, DisplayName: "LinkedIn", OAuthKind: "oauth2",
			AuthURL: "https://www.linkedin.com/oauth/v2/authorization", TokenURL: "https://www.linkedin.com/oauth/v2/accessToken",
			Scopes:       []string{"openid", "profile", "w_member_social"},
			Capabilities: []Capability{CapabilityText, CapabilityImage, CapabilityLink},
			MaxText:      3000, PKCE: true,
			Docs: "https://learn.microsoft.com/en-us/linkedin/shared/authentication/authorization-code-flow",
		},
		PlatformMeta: {
			ID: PlatformMeta, DisplayName: "Meta", OAuthKind: "oauth2",
			AuthURL: "https://www.facebook.com/v21.0/dialog/oauth", TokenURL: "https://graph.facebook.com/v21.0/oauth/access_token",
			Scopes:       []string{"pages_show_list", "pages_manage_posts", "pages_read_engagement"},
			Capabilities: []Capability{CapabilityText, CapabilityImage, CapabilityVideo, CapabilityLink},
			MaxText:      63206, PKCE: false,
			Docs: "https://developers.facebook.com/docs/facebook-login/guides/advanced/manual-flow",
		},
	}
}

func Lookup(id string) (Spec, bool) {
	spec, ok := Catalog()[Platform(strings.ToLower(strings.TrimSpace(id)))]
	return spec, ok
}

func (s Spec) Supports(c Capability) bool {
	for _, have := range s.Capabilities {
		if have == c {
			return true
		}
	}
	return false
}
