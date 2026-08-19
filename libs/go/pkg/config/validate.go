package config

import (
	"net/url"
	"strings"
	"time"
	"unicode"
)

func validateRuntime(cfg RuntimeConfig, at time.Time) error {
	if !cfg.Environment.Valid() {
		return configErr("malformed", "AGBOFA_ENV", "environment is not recognized", cfg.Environment, ErrUnknownEnvironment)
	}
	if strings.TrimSpace(cfg.ServiceName) == "" {
		return missing("AGBOFA_SERVICE_NAME", cfg.Environment)
	}
	if strings.TrimSpace(cfg.HTTP.Addr) == "" {
		return missing("AGBOFA_HTTP_ADDR", cfg.Environment)
	}
	if strings.TrimSpace(cfg.GRPC.Addr) == "" {
		return missing("AGBOFA_GRPC_ADDR", cfg.Environment)
	}
	if cfg.Database.MaxConns <= 0 {
		return malformed("AGBOFA_DATABASE_MAX_CONNS", "must be a positive integer", cfg.Environment)
	}
	if cfg.Database.MinConns < 0 || cfg.Database.MinConns > cfg.Database.MaxConns {
		return malformed("AGBOFA_DATABASE_MIN_CONNS", "must be between 0 and max connections", cfg.Environment)
	}
	if cfg.Database.QueryTimeout <= 0 {
		return malformed("AGBOFA_DATABASE_QUERY_TIMEOUT", "must be a positive duration", cfg.Environment)
	}
	if cfg.Environment != EnvTest && cfg.Database.URL.Empty() {
		return missing("database/url", cfg.Environment)
	}

	if err := validateJWT(cfg, at); err != nil {
		return err
	}
	if err := validateCookie(cfg); err != nil {
		return err
	}
	if err := validateCORS(cfg); err != nil {
		return err
	}
	if strings.TrimSpace(cfg.CSRF.CookieName) == "" {
		return missing("AGBOFA_CSRF_COOKIE_NAME", cfg.Environment)
	}
	if strings.TrimSpace(cfg.CSRF.HeaderName) == "" {
		return missing("AGBOFA_CSRF_HEADER_NAME", cfg.Environment)
	}
	return nil
}

func validateJWT(cfg RuntimeConfig, at time.Time) error {
	if strings.TrimSpace(cfg.JWT.Issuer) == "" {
		return missing("AGBOFA_JWT_ISSUER", cfg.Environment)
	}
	if strings.TrimSpace(cfg.JWT.Audience) == "" {
		return missing("AGBOFA_JWT_AUDIENCE", cfg.Environment)
	}
	if strings.ContainsAny(cfg.JWT.Audience, " \t") || cfg.JWT.Audience == "*" {
		return malformed("AGBOFA_JWT_AUDIENCE", "audience must be a concrete identifier", cfg.Environment)
	}
	issuer, err := url.Parse(cfg.JWT.Issuer)
	if err != nil || issuer.Scheme == "" || issuer.Host == "" {
		return malformed("AGBOFA_JWT_ISSUER", "issuer must be an absolute URI with a host", cfg.Environment)
	}
	if cfg.Environment.Strict() && !strings.EqualFold(issuer.Scheme, "https") {
		return unsafe("AGBOFA_JWT_ISSUER", "strict environments require an https issuer", cfg.Environment)
	}
	if !strings.EqualFold(issuer.Scheme, "https") && !strings.EqualFold(issuer.Scheme, "http") {
		return malformed("AGBOFA_JWT_ISSUER", "issuer scheme must be http or https", cfg.Environment)
	}

	alg := strings.ToUpper(strings.TrimSpace(cfg.JWT.Algorithm))
	if alg == "" {
		return missing("AGBOFA_JWT_ALGORITHM", cfg.Environment)
	}
	if alg == "NONE" || alg == "ALG=NONE" {
		return unsafe("AGBOFA_JWT_ALGORITHM", "alg=none is forbidden", cfg.Environment)
	}
	if alg != AlgorithmRS256 {
		return malformed("AGBOFA_JWT_ALGORITHM", "only RS256 is accepted", cfg.Environment)
	}
	if cfg.JWT.AccessTokenTTL <= 0 {
		return malformed("AGBOFA_JWT_ACCESS_TTL", "must be a positive duration", cfg.Environment)
	}
	if cfg.JWT.RefreshTTL <= 0 {
		return malformed("AGBOFA_JWT_REFRESH_TTL", "must be a positive duration", cfg.Environment)
	}
	if strings.TrimSpace(cfg.JWT.ActiveKID) == "" {
		return missing("AGBOFA_JWT_ACTIVE_KID", cfg.Environment)
	}
	if len(cfg.JWT.Keys) == 0 {
		return missing("AGBOFA_JWT_KEYS", cfg.Environment)
	}

	seen := map[string]struct{}{}
	for _, key := range cfg.JWT.Keys {
		if err := validateJWTKey(cfg.Environment, key); err != nil {
			return err
		}
		if _, ok := seen[key.KID]; ok {
			return malformed("AGBOFA_JWT_KEYS", "duplicate key id", cfg.Environment)
		}
		seen[key.KID] = struct{}{}
	}

	if _, err := cfg.JWT.SigningKey(at); err != nil {
		return invalidSecret("AGBOFA_JWT_ACTIVE_KID", "active signing key is missing, expired, or not yet valid", cfg.Environment)
	}
	if len(cfg.JWT.VerificationKeys(at)) == 0 {
		return invalidSecret("AGBOFA_JWT_KEYS", "no verification key is inside the rotation window", cfg.Environment)
	}
	return nil
}

func validateJWTKey(env Environment, key JWTKey) error {
	if !validKID(key.KID) {
		return malformed("AGBOFA_JWT_KEYS", "key id must be 1-64 characters of [A-Za-z0-9._-]", env)
	}
	use := strings.ToLower(strings.TrimSpace(key.Use))
	if use != KeyUseSign && use != KeyUseVerify {
		return malformed("jwt key use", "use must be sign or verify", env)
	}
	if !strings.EqualFold(key.Algorithm, AlgorithmRS256) {
		return malformed("jwt key algorithm", "only RS256 keys are accepted", env)
	}
	if key.PublicPEM.Empty() {
		return missing("jwt/keys/"+key.KID+"/public_pem", env)
	}
	if !looksLikePEM(key.PublicPEM.Reveal(), "KEY") && !looksLikePEM(key.PublicPEM.Reveal(), "CERTIFICATE") {
		return invalidSecret("jwt/keys/"+key.KID+"/public_pem", "value is not a PEM public key", env)
	}
	if use == KeyUseSign {
		if key.PrivatePEM.Empty() {
			return missing("jwt/keys/"+key.KID+"/private_pem", env)
		}
		if !looksLikePEM(key.PrivatePEM.Reveal(), "PRIVATE KEY") {
			return invalidSecret("jwt/keys/"+key.KID+"/private_pem", "value is not a PEM private key", env)
		}
	}
	if !key.NotBefore.IsZero() && !key.NotAfter.IsZero() && !key.NotBefore.Before(key.NotAfter) {
		return malformed("jwt key window", "not_before must be earlier than not_after", env)
	}
	return nil
}

func validateCookie(cfg RuntimeConfig) error {
	if strings.TrimSpace(cfg.Cookie.Name) == "" {
		return missing("AGBOFA_COOKIE_NAME", cfg.Environment)
	}
	if strings.ContainsAny(cfg.Cookie.Name, " \t;") {
		return malformed("AGBOFA_COOKIE_NAME", "cookie name contains illegal characters", cfg.Environment)
	}
	if !cfg.Cookie.HTTPOnly {
		return unsafe("AGBOFA_COOKIE_HTTPONLY", "authentication cookies must be HttpOnly", cfg.Environment)
	}
	switch cfg.Cookie.SameSite {
	case SameSiteStrict, SameSiteLax, SameSiteNone:
	default:
		return malformed("AGBOFA_COOKIE_SAMESITE", "must be Strict, Lax, or None", cfg.Environment)
	}
	if cfg.Cookie.SameSite == SameSiteNone && !cfg.Cookie.Secure {
		return unsafe("AGBOFA_COOKIE_SECURE", "SameSite=None requires Secure", cfg.Environment)
	}
	if strings.TrimSpace(cfg.Cookie.Path) == "" {
		return missing("AGBOFA_COOKIE_PATH", cfg.Environment)
	}
	if !strings.HasPrefix(cfg.Cookie.Path, "/") {
		return malformed("AGBOFA_COOKIE_PATH", "path must be absolute", cfg.Environment)
	}
	if cfg.Cookie.MaxAge <= 0 {
		return malformed("AGBOFA_COOKIE_MAX_AGE", "must be a positive duration", cfg.Environment)
	}
	if cfg.Environment.Strict() && !cfg.Cookie.Secure {
		return unsafe("AGBOFA_COOKIE_SECURE", "strict environments require Secure cookies", cfg.Environment)
	}
	return nil
}

func validateCORS(cfg RuntimeConfig) error {
	if !cfg.Environment.Strict() {
		return nil
	}
	for _, origin := range cfg.CORS.AllowedOrigins {
		if origin == "*" {
			return unsafe("AGBOFA_CORS_ALLOWED_ORIGINS", "wildcard CORS is forbidden for credentialed APIs", cfg.Environment)
		}
	}
	return nil
}

func validKID(kid string) bool {
	if kid == "" || len(kid) > 64 {
		return false
	}
	for _, r := range kid {
		if unicode.IsLetter(r) || unicode.IsDigit(r) || r == '-' || r == '_' || r == '.' {
			continue
		}
		return false
	}
	return true
}
