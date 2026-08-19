package auth

import (
	"net/http"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

const (
	AccessCookieName  = "agbofa_session"
	RefreshCookieName = "agbofa_refresh"
	CSRFCookieName    = "agbofa_csrf"
)

func SessionCookie(cfg config.CookieConfig, name, value string, maxAge time.Duration) http.Cookie {
	sameSite := http.SameSiteLaxMode
	switch cfg.SameSite {
	case config.SameSiteStrict:
		sameSite = http.SameSiteStrictMode
	case config.SameSiteNone:
		sameSite = http.SameSiteNoneMode
	}
	if name == "" {
		name = cfg.Name
	}
	if name == "" {
		name = AccessCookieName
	}
	if maxAge <= 0 {
		maxAge = cfg.MaxAge
	}
	return http.Cookie{
		Name:     name,
		Value:    value,
		Path:     firstNonEmpty(cfg.Path, "/"),
		Domain:   cfg.Domain,
		MaxAge:   int(maxAge.Seconds()),
		Secure:   cfg.Secure,
		HttpOnly: true,
		SameSite: sameSite,
	}
}

func ExpiredCookie(cfg config.CookieConfig, name string) http.Cookie {
	c := SessionCookie(cfg, name, "", time.Second)
	c.MaxAge = -1
	c.Expires = time.Unix(0, 0)
	return c
}

func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}
