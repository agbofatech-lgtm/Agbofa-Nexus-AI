// Package youtube provides YouTube connector configuration.
package youtube

import (
"errors"
"os"
)

// Config holds YouTube API configuration.
type Config struct {
APIKey       string
ClientID     string
ClientSecret string
RedirectURI  string
}

// LoadConfigFromEnv loads YouTube configuration from environment variables.
func LoadConfigFromEnv() (*Config, error) {
cfg := &Config{
APIKey:       os.Getenv("YOUTUBE_API_KEY"),
ClientID:     os.Getenv("YOUTUBE_CLIENT_ID"),
ClientSecret: os.Getenv("YOUTUBE_CLIENT_SECRET"),
RedirectURI:  os.Getenv("YOUTUBE_REDIRECT_URI"),
}

if cfg.APIKey == "" {
return nil, errors.New("YOUTUBE_API_KEY is required")
}
if cfg.ClientID == "" {
return nil, errors.New("YOUTUBE_CLIENT_ID is required")
}
if cfg.ClientSecret == "" {
return nil, errors.New("YOUTUBE_CLIENT_SECRET is required")
}
if cfg.RedirectURI == "" {
cfg.RedirectURI = "http://localhost:8080/oauth/youtube/callback"
}

return cfg, nil
}
