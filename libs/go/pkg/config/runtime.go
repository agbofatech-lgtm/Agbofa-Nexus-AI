package config

import "time"

const (
	AlgorithmRS256 = "RS256"
	SameSiteStrict = "Strict"
	SameSiteLax    = "Lax"
	SameSiteNone   = "None"
	KeyUseSign     = "sign"
	KeyUseVerify   = "verify"
)

// RuntimeConfig is the typed process configuration. Secret fields use Secret.
type RuntimeConfig struct {
	Environment    Environment
	ServiceName    string
	SecretProvider string
	HTTP           HTTPConfig
	GRPC           GRPCConfig
	Database       DatabaseConfig
	JWT            JWTConfig
	Cookie         CookieConfig
	CSRF           CSRFConfig
	CORS           CORSConfig
	RateLimit      RateLimitConfig
	Operations     OperationsConfig
}

type HTTPConfig struct {
	Addr              string
	ReadHeaderTimeout time.Duration
	ShutdownTimeout   time.Duration
}

type GRPCConfig struct {
	Addr string
}

type DatabaseConfig struct {
	URL          Secret
	MaxConns     int
	MinConns     int
	QueryTimeout time.Duration
}

type JWTConfig struct {
	Issuer         string
	Audience       string
	Algorithm      string
	AccessTokenTTL time.Duration
	RefreshTTL     time.Duration
	ActiveKID      string
	Keys           []JWTKey
}

type JWTKey struct {
	KID        string
	Use        string
	Algorithm  string
	PrivatePEM Secret
	PublicPEM  Secret
	NotBefore  time.Time
	NotAfter   time.Time
}

type CookieConfig struct {
	Name     string
	Secure   bool
	HTTPOnly bool
	SameSite string
	Path     string
	Domain   string
	MaxAge   time.Duration
}

type CSRFConfig struct {
	CookieName string
	HeaderName string
}

type CORSConfig struct {
	AllowedOrigins []string
}

type RateLimitConfig struct {
	Enabled    bool
	FailClosed bool
}

type OperationsConfig struct {
	PublishTickTimeout time.Duration
}

// PublicSnapshot is safe for structured startup logs. It contains no secrets.
func (c RuntimeConfig) PublicSnapshot() map[string]any {
	kids := make([]string, 0, len(c.JWT.Keys))
	uses := make([]string, 0, len(c.JWT.Keys))
	for _, key := range c.JWT.Keys {
		kids = append(kids, key.KID)
		uses = append(uses, key.Use)
	}
	return map[string]any{
		"environment":            string(c.Environment),
		"service_name":           c.ServiceName,
		"secret_provider":        c.SecretProvider,
		"http_addr":              c.HTTP.Addr,
		"http_read_header_timeout": c.HTTP.ReadHeaderTimeout.String(),
		"http_shutdown_timeout":  c.HTTP.ShutdownTimeout.String(),
		"grpc_addr":              c.GRPC.Addr,
		"database_url_present":   !c.Database.URL.Empty(),
		"database_max_conns":     c.Database.MaxConns,
		"database_min_conns":     c.Database.MinConns,
		"database_query_timeout": c.Database.QueryTimeout.String(),
		"jwt_issuer":            c.JWT.Issuer,
		"jwt_audience":          c.JWT.Audience,
		"jwt_algorithm":         c.JWT.Algorithm,
		"jwt_active_kid":        c.JWT.ActiveKID,
		"jwt_key_kids":          kids,
		"jwt_key_uses":          uses,
		"cookie_name":           c.Cookie.Name,
		"cookie_secure":         c.Cookie.Secure,
		"cookie_httponly":       c.Cookie.HTTPOnly,
		"cookie_samesite":       c.Cookie.SameSite,
		"cookie_path":           c.Cookie.Path,
		"cookie_domain_set":     c.Cookie.Domain != "",
		"csrf_cookie_name":      c.CSRF.CookieName,
		"csrf_header_name":      c.CSRF.HeaderName,
		"cors_allowed_origins":  append([]string(nil), c.CORS.AllowedOrigins...),
		"rate_limit_enabled":    c.RateLimit.Enabled,
		"rate_limit_fail_closed": c.RateLimit.FailClosed,
		"publish_tick_timeout":  c.Operations.PublishTickTimeout.String(),
	}
}
