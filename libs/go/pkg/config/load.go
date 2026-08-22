package config

import (
	"context"
	"errors"
	"os"
	"strconv"
	"strings"
	"time"
)

const envPrefix = "AGBOFA_"

// LoadOptions controls configuration assembly. Tests inject lookup, time, and
// providers. Production callers typically pass zero values.
type LoadOptions struct {
	Lookup   LookupFunc
	Now      func() time.Time
	Provider SecretProvider
	Files    FileReader
}

// Load reads environment + secrets and fail-closes on invalid production config.
func Load(ctx context.Context, opts LoadOptions) (RuntimeConfig, error) {
	lookup := opts.Lookup
	if lookup == nil {
		lookup = os.LookupEnv
	}
	now := time.Now
	if opts.Now != nil {
		now = opts.Now
	}

	rawEnv, _ := lookup(envPrefix + "ENV")
	env, err := ParseEnvironment(rawEnv)
	if err != nil {
		if err == ErrMissingRequired {
			return RuntimeConfig{}, missing("AGBOFA_ENV", "")
		}
		return RuntimeConfig{}, configErr("malformed", "AGBOFA_ENV", "must be development, staging, production, or test", "", ErrUnknownEnvironment)
	}

	provider, err := resolveProvider(opts, lookup, env)
	if err != nil {
		return RuntimeConfig{}, err
	}

	readHeaderTimeout, err := getDuration(lookup, "HTTP_READ_HEADER_TIMEOUT", 5*time.Second)
	if err != nil {
		return RuntimeConfig{}, malformed("AGBOFA_HTTP_READ_HEADER_TIMEOUT", "must be a duration such as 5s", env)
	}
	shutdownTimeout, err := getDuration(lookup, "HTTP_SHUTDOWN_TIMEOUT", 10*time.Second)
	if err != nil {
		return RuntimeConfig{}, malformed("AGBOFA_HTTP_SHUTDOWN_TIMEOUT", "must be a duration such as 10s", env)
	}
	rateLimitEnabled, err := getBool(lookup, "RATE_LIMIT_ENABLED", true)
	if err != nil {
		return RuntimeConfig{}, malformed("AGBOFA_RATE_LIMIT_ENABLED", "must be true or false", env)
	}
	rateLimitFailClosed, err := getBool(lookup, "RATE_LIMIT_FAIL_CLOSED", env.Strict())
	if err != nil {
		return RuntimeConfig{}, malformed("AGBOFA_RATE_LIMIT_FAIL_CLOSED", "must be true or false", env)
	}
	publishTickTimeout, err := getDuration(lookup, "PUBLISH_TICK_TIMEOUT", 110*time.Second)
	if err != nil {
		return RuntimeConfig{}, malformed("AGBOFA_PUBLISH_TICK_TIMEOUT", "must be a duration such as 110s", env)
	}

	cfg := RuntimeConfig{
		Environment:    env,
		ServiceName:    getDefault(lookup, "SERVICE_NAME", "foundation"),
		SecretProvider: provider.Name(),
		HTTP: HTTPConfig{
			Addr:              getDefault(lookup, "HTTP_ADDR", ":8080"),
			ReadHeaderTimeout: readHeaderTimeout,
			ShutdownTimeout:   shutdownTimeout,
		},
		GRPC: GRPCConfig{Addr: getDefault(lookup, "GRPC_ADDR", ":9090")},
		CSRF: CSRFConfig{
			CookieName: getDefault(lookup, "CSRF_COOKIE_NAME", "agbofa_csrf"),
			HeaderName: getDefault(lookup, "CSRF_HEADER_NAME", "X-CSRF-Token"),
		},
		RateLimit: RateLimitConfig{Enabled: rateLimitEnabled, FailClosed: rateLimitFailClosed},
		Operations: OperationsConfig{PublishTickTimeout: publishTickTimeout},
	}

	if err := loadDatabase(ctx, &cfg, lookup, provider); err != nil {
		return RuntimeConfig{}, err
	}
	if err := loadJWT(ctx, &cfg, lookup, provider); err != nil {
		return RuntimeConfig{}, err
	}
	if err := loadCookie(&cfg, lookup); err != nil {
		return RuntimeConfig{}, err
	}
	cfg.CORS.AllowedOrigins = splitCSV(getDefault(lookup, "CORS_ALLOWED_ORIGINS", ""))

	if err := validateRuntime(cfg, now()); err != nil {
		return RuntimeConfig{}, err
	}
	return cfg, nil
}

func resolveProvider(opts LoadOptions, lookup LookupFunc, env Environment) (SecretProvider, error) {
	if opts.Provider != nil {
		return opts.Provider, nil
	}
	kind := getDefault(lookup, "SECRET_PROVIDER", "env")
	provider, err := NewSecretProvider(ProviderOptions{
		Kind:   kind,
		Lookup: lookup,
		Dir:    getDefault(lookup, "SECRET_FILE_DIR", ""),
		Read:   opts.Files,
	})
	if err != nil {
		return nil, configErr("invalid_secret", "AGBOFA_SECRET_PROVIDER", Redact(err.Error()), env, err)
	}
	return provider, nil
}

func loadDatabase(ctx context.Context, cfg *RuntimeConfig, lookup LookupFunc, provider SecretProvider) error {
	maxConns, err := getInt(lookup, "DATABASE_MAX_CONNS", 10)
	if err != nil {
		return malformed("AGBOFA_DATABASE_MAX_CONNS", "must be an integer", cfg.Environment)
	}
	minConns, err := getInt(lookup, "DATABASE_MIN_CONNS", 1)
	if err != nil {
		return malformed("AGBOFA_DATABASE_MIN_CONNS", "must be an integer", cfg.Environment)
	}
	timeout, err := getDuration(lookup, "DATABASE_QUERY_TIMEOUT", 5*time.Second)
	if err != nil {
		return malformed("AGBOFA_DATABASE_QUERY_TIMEOUT", "must be a duration such as 5s", cfg.Environment)
	}
	cfg.Database.MaxConns = maxConns
	cfg.Database.MinConns = minConns
	cfg.Database.QueryTimeout = timeout

	secretName := getDefault(lookup, "DATABASE_URL_SECRET", "database/url")
	secret, err := provider.Get(ctx, secretName)
	if err != nil {
		if cfg.Environment == EnvTest {
			cfg.Database.URL = Secret{}
			return nil
		}
		if errors.Is(err, ErrInvalidSecret) {
			return invalidSecret(secretName, "secret provider rejected the lookup", cfg.Environment)
		}
		return missing(secretName, cfg.Environment)
	}
	cfg.Database.URL = secret
	return nil
}

func loadJWT(ctx context.Context, cfg *RuntimeConfig, lookup LookupFunc, provider SecretProvider) error {
	accessTTL, err := getDuration(lookup, "JWT_ACCESS_TTL", 15*time.Minute)
	if err != nil {
		return malformed("AGBOFA_JWT_ACCESS_TTL", "must be a duration such as 15m", cfg.Environment)
	}
	refreshTTL, err := getDuration(lookup, "JWT_REFRESH_TTL", 720*time.Hour)
	if err != nil {
		return malformed("AGBOFA_JWT_REFRESH_TTL", "must be a duration such as 720h", cfg.Environment)
	}
	cfg.JWT.Issuer = strings.TrimSpace(getDefault(lookup, "JWT_ISSUER", ""))
	cfg.JWT.Audience = strings.TrimSpace(getDefault(lookup, "JWT_AUDIENCE", ""))
	cfg.JWT.Algorithm = strings.ToUpper(strings.TrimSpace(getDefault(lookup, "JWT_ALGORITHM", AlgorithmRS256)))
	cfg.JWT.AccessTokenTTL = accessTTL
	cfg.JWT.RefreshTTL = refreshTTL
	cfg.JWT.ActiveKID = strings.TrimSpace(getDefault(lookup, "JWT_ACTIVE_KID", ""))

	kids := splitCSV(getDefault(lookup, "JWT_KEYS", ""))
	cfg.JWT.Keys = make([]JWTKey, 0, len(kids))
	for _, kid := range kids {
		key, err := loadJWTKey(ctx, cfg.Environment, kid, lookup, provider)
		if err != nil {
			return err
		}
		cfg.JWT.Keys = append(cfg.JWT.Keys, key)
	}
	return nil
}

func loadJWTKey(ctx context.Context, env Environment, kid string, lookup LookupFunc, provider SecretProvider) (JWTKey, error) {
	token := envKeyToken(kid)
	use := strings.ToLower(getDefault(lookup, "JWT_KEY_"+token+"_USE", KeyUseSign))
	if kid == "" {
		return JWTKey{}, malformed("AGBOFA_JWT_KEYS", "empty key id", env)
	}
	publicName := getDefault(lookup, "JWT_KEY_"+token+"_PUBLIC_SECRET", "jwt/keys/"+kid+"/public_pem")
	privateName := getDefault(lookup, "JWT_KEY_"+token+"_PRIVATE_SECRET", "jwt/keys/"+kid+"/private_pem")

	public, err := provider.Get(ctx, publicName)
	if err != nil {
		return JWTKey{}, missing(publicName, env)
	}

	key := JWTKey{
		KID:       kid,
		Use:       use,
		Algorithm: AlgorithmRS256,
		PublicPEM: public,
	}
	if notBefore, ok, err := getOptionalTime(lookup, "JWT_KEY_"+token+"_NOT_BEFORE"); err != nil {
		return JWTKey{}, malformed("AGBOFA_JWT_KEY_"+token+"_NOT_BEFORE", "must be RFC3339", env)
	} else if ok {
		key.NotBefore = notBefore
	}
	if notAfter, ok, err := getOptionalTime(lookup, "JWT_KEY_"+token+"_NOT_AFTER"); err != nil {
		return JWTKey{}, malformed("AGBOFA_JWT_KEY_"+token+"_NOT_AFTER", "must be RFC3339", env)
	} else if ok {
		key.NotAfter = notAfter
	}
	if use == KeyUseSign {
		private, err := provider.Get(ctx, privateName)
		if err != nil {
			return JWTKey{}, missing(privateName, env)
		}
		key.PrivatePEM = private
	}
	return key, nil
}

func loadCookie(cfg *RuntimeConfig, lookup LookupFunc) error {
	secure, err := getBool(lookup, "COOKIE_SECURE", cfg.Environment.Strict())
	if err != nil {
		return malformed("AGBOFA_COOKIE_SECURE", "must be true or false", cfg.Environment)
	}
	httpOnly, err := getBool(lookup, "COOKIE_HTTPONLY", true)
	if err != nil {
		return malformed("AGBOFA_COOKIE_HTTPONLY", "must be true or false", cfg.Environment)
	}
	maxAge, err := getDuration(lookup, "COOKIE_MAX_AGE", cfg.JWT.RefreshTTL)
	if err != nil {
		return malformed("AGBOFA_COOKIE_MAX_AGE", "must be a duration such as 720h", cfg.Environment)
	}
	cfg.Cookie = CookieConfig{
		Name:     getDefault(lookup, "COOKIE_NAME", "agbofa_session"),
		Secure:   secure,
		HTTPOnly: httpOnly,
		SameSite: getDefault(lookup, "COOKIE_SAMESITE", SameSiteLax),
		Path:     getDefault(lookup, "COOKIE_PATH", "/"),
		Domain:   getDefault(lookup, "COOKIE_DOMAIN", ""),
		MaxAge:   maxAge,
	}
	return nil
}

func getDefault(lookup LookupFunc, key, fallback string) string {
	value, ok := lookup(envPrefix + key)
	if !ok || strings.TrimSpace(value) == "" {
		return fallback
	}
	return strings.TrimSpace(value)
}

func getInt(lookup LookupFunc, key string, fallback int) (int, error) {
	raw, ok := lookup(envPrefix + key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback, nil
	}
	return strconv.Atoi(strings.TrimSpace(raw))
}

func getDuration(lookup LookupFunc, key string, fallback time.Duration) (time.Duration, error) {
	raw, ok := lookup(envPrefix + key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback, nil
	}
	return time.ParseDuration(strings.TrimSpace(raw))
}

func getBool(lookup LookupFunc, key string, fallback bool) (bool, error) {
	raw, ok := lookup(envPrefix + key)
	if !ok || strings.TrimSpace(raw) == "" {
		return fallback, nil
	}
	switch strings.ToLower(strings.TrimSpace(raw)) {
	case "1", "true", "yes", "on":
		return true, nil
	case "0", "false", "no", "off":
		return false, nil
	default:
		return false, ErrMalformed
	}
}

func getOptionalTime(lookup LookupFunc, key string) (time.Time, bool, error) {
	raw, ok := lookup(envPrefix + key)
	if !ok || strings.TrimSpace(raw) == "" {
		return time.Time{}, false, nil
	}
	parsed, err := time.Parse(time.RFC3339, strings.TrimSpace(raw))
	if err != nil {
		return time.Time{}, false, err
	}
	return parsed, true, nil
}

func splitCSV(raw string) []string {
	if strings.TrimSpace(raw) == "" {
		return nil
	}
	parts := strings.Split(raw, ",")
	out := make([]string, 0, len(parts))
	for _, part := range parts {
		part = strings.TrimSpace(part)
		if part != "" {
			out = append(out, part)
		}
	}
	return out
}

func envKeyToken(kid string) string {
	return strings.ToUpper(strings.NewReplacer("-", "_", ".", "_", "/", "_").Replace(kid))
}
