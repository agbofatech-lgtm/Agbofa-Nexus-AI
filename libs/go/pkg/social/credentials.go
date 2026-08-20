package social

import (
	"os"
	"strings"
)

// ClientID resolves a platform OAuth client id from the repository contract.
// Preferred (Phase 01 secret env): AGBOFA_SECRET_SOCIAL_{PLATFORM}_CLIENT_ID
// Existing fallback:               AGBOFA_OAUTH_{PLATFORM}_CLIENT_ID
func ClientID(p Platform) string {
	key := strings.ToUpper(string(p))
	return firstEnv(
		"AGBOFA_SECRET_SOCIAL_"+key+"_CLIENT_ID",
		"AGBOFA_OAUTH_"+key+"_CLIENT_ID",
	)
}

// ClientSecret resolves a platform OAuth client secret. Never log the result.
func ClientSecret(p Platform) string {
	key := strings.ToUpper(string(p))
	return firstEnv(
		"AGBOFA_SECRET_SOCIAL_"+key+"_CLIENT_SECRET",
		"AGBOFA_OAUTH_"+key+"_CLIENT_SECRET",
	)
}

// RedirectURI is the configured callback. Empty means the request redirect is
// used after validateRedirect / RedirectAllowed.
func RedirectURI(p Platform) string {
	key := strings.ToUpper(string(p))
	return firstEnv("AGBOFA_SOCIAL_" + key + "_REDIRECT_URI")
}

func firstEnv(names ...string) string {
	for _, name := range names {
		if v := strings.TrimSpace(os.Getenv(name)); v != "" {
			return v
		}
	}
	return ""
}
