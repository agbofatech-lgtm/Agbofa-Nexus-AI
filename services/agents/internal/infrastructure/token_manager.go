package infrastructure

import (
	"context"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/redis/go-redis/v9"

	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type tokenEntry struct {
	AccessToken string    `json:"access_token"`
	ExpiresAt   time.Time `json:"expires_at"`
}

type TokenManager struct {
	mu          sync.RWMutex
	redisClient *redis.Client
	memCache    map[domain.PlatformSource]tokenEntry
}

func NewTokenManager(redisURL string) *TokenManager {
	if redisURL == "" {
		redisURL = os.Getenv("REDIS_URL")
	}
	if redisURL == "" {
		redisURL = "redis://localhost:6379/0"
	}

	opt, err := redis.ParseURL(redisURL)
	var rdb *redis.Client
	if err != nil {
		log.Printf("WARN [TokenManager]: invalid REDIS_URL %s: %v, falling back to memory cache", redisURL, err)
	} else {
		rdb = redis.NewClient(opt)
	}

	return &TokenManager{
		redisClient: rdb,
		memCache:    make(map[domain.PlatformSource]tokenEntry),
	}
}

func (m *TokenManager) cacheKey(platform domain.PlatformSource) string {
	return fmt.Sprintf("oauth:token:%s", platform)
}

func (m *TokenManager) GetToken(ctx context.Context, platform domain.PlatformSource) (string, error) {
	if !platform.IsValid() {
		return "", domain.ErrInvalidPlatform
	}

	m.mu.RLock()
	entry, found := m.memCache[platform]
	m.mu.RUnlock()

	now := time.Now()
	if found && entry.AccessToken != "" && now.Add(5*time.Minute).Before(entry.ExpiresAt) {
		return entry.AccessToken, nil
	}

	// Try checking Redis cache if available
	if m.redisClient != nil {
		key := m.cacheKey(platform)
		val, err := m.redisClient.Get(ctx, key).Result()
		if err == nil && val != "" {
			m.mu.Lock()
			m.memCache[platform] = tokenEntry{
				AccessToken: val,
				ExpiresAt:   now.Add(55 * time.Minute),
			}
			m.mu.Unlock()
			return val, nil
		}
	}

	if err := m.RefreshToken(ctx, platform); err != nil {
		return "", err
	}

	m.mu.RLock()
	entry, found = m.memCache[platform]
	m.mu.RUnlock()

	if !found || entry.AccessToken == "" {
		return "", fmt.Errorf("token refresh failed for %s: %w", platform, domain.ErrInvalidCredentials)
	}
	return entry.AccessToken, nil
}

func (m *TokenManager) RefreshToken(ctx context.Context, platform domain.PlatformSource) error {
	m.mu.Lock()
	defer m.mu.Unlock()

	var token string
	var err error

	switch platform {
	case domain.PlatformTwitter:
		token = os.Getenv("TWITTER_BEARER_TOKEN")
		if token == "" {
			token = os.Getenv("TWITTER_API_KEY")
		}
	case domain.PlatformFacebook:
		appID := os.Getenv("FACEBOOK_APP_ID")
		appSecret := os.Getenv("FACEBOOK_APP_SECRET")
		if appID != "" && appSecret != "" {
			token = fmt.Sprintf("%s|%s", appID, appSecret)
		}
	case domain.PlatformInstagram:
		token = os.Getenv("INSTAGRAM_GRAPH_API_KEY")
	case domain.PlatformTikTok:
		token = os.Getenv("TIKTOK_CLIENT_KEY")
	case domain.PlatformLinkedIn:
		token = os.Getenv("LINKEDIN_CLIENT_SECRET")
		if token == "" {
			token = os.Getenv("LINKEDIN_CLIENT_ID")
		}
	case domain.PlatformYouTube:
		token = os.Getenv("YOUTUBE_API_KEY")
	case domain.PlatformReddit:
		token = os.Getenv("REDDIT_CLIENT_SECRET")
	case domain.PlatformEmerging, domain.PlatformRSS:
		token = "rss-feed-active"
	default:
		return domain.ErrInvalidPlatform
	}

	if token == "" {
		err = fmt.Errorf("missing environment credentials for platform %s: %w", platform, domain.ErrInvalidCredentials)
		log.Printf("ERROR [TokenManager]: %v", err)
		return err
	}

	expiry := time.Now().Add(55 * time.Minute)
	m.memCache[platform] = tokenEntry{
		AccessToken: token,
		ExpiresAt:   expiry,
	}

	if m.redisClient != nil {
		key := m.cacheKey(platform)
		if err := m.redisClient.Set(ctx, key, token, 55*time.Minute).Err(); err != nil {
			log.Printf("WARN [TokenManager]: failed to persist token for %s to Redis: %v", platform, err)
		}
	}

	log.Printf("DEBUG [TokenManager]: refreshed token for platform %s (expires: %s)", platform, expiry.Format(time.RFC3339))
	return nil
}

func (m *TokenManager) SetTokenForTest(platform domain.PlatformSource, token string, expiresAt time.Time) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.memCache[platform] = tokenEntry{
		AccessToken: token,
		ExpiresAt:   expiresAt,
	}
}
