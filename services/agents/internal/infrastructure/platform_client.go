package infrastructure

import (
	"context"
	"encoding/json"
	"encoding/xml"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/agbofa/nexus/services/agents/internal/application"
	"github.com/agbofa/nexus/services/agents/internal/domain"
)

type TwitterClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewTwitterClient(tokenMgr *TokenManager) *TwitterClient {
	return &TwitterClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *TwitterClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformTwitter)
	if err != nil || token == "" {
		return nil, fmt.Errorf("twitter token error: %w", domain.ErrInvalidCredentials)
	}
	if len(query) == 0 {
		return nil, nil
	}
	qStr := url.QueryEscape(strings.Join(query, " OR "))
	apiURL := fmt.Sprintf("https://api.twitter.com/2/tweets/search/recent?query=%s&tweet.fields=created_at,public_metrics,author_id", qStr)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build twitter req: %w", domain.ErrUpstreamError)
	}
	req.Header.Set("Authorization", "Bearer "+token)

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("twitter API network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("twitter auth error (status %d): %w", resp.StatusCode, domain.ErrInvalidCredentials)
	}
	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, fmt.Errorf("twitter API rate limited: %w", domain.ErrRateLimitExceeded)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("twitter API error (status %d): %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data struct {
		Data []struct {
			ID            string    `json:"id"`
			Text          string    `json:"text"`
			AuthorID      string    `json:"author_id"`
			CreatedAt     time.Time `json:"created_at"`
			PublicMetrics struct {
				RetweetCount int `json:"retweet_count"`
				LikeCount    int `json:"like_count"`
			} `json:"public_metrics"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to parse twitter JSON: %w", domain.ErrUpstreamError)
	}

	signals := make([]domain.MonitorSignal, 0, len(data.Data))
	for _, tw := range data.Data {
		eng := tw.PublicMetrics.LikeCount + tw.PublicMetrics.RetweetCount
		signals = append(signals, domain.MonitorSignal{
			SignalID:   tw.ID,
			TenantID:   tenantID,
			Platform:   domain.PlatformTwitter,
			SourceID:   tw.AuthorID,
			Author:     fmt.Sprintf("@author_%s", tw.AuthorID),
			Content:    tw.Text,
			URL:        fmt.Sprintf("https://twitter.com/user/status/%s", tw.ID),
			Engagement: eng,
			Velocity:   float64(eng) / 10.0,
			DetectedAt: tw.CreatedAt,
			Metadata:   map[string]string{"source_api": "twitter_api_v2"},
		})
	}
	return signals, nil
}

type FacebookClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewFacebookClient(tokenMgr *TokenManager) *FacebookClient {
	return &FacebookClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *FacebookClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformFacebook)
	if err != nil || token == "" {
		return nil, fmt.Errorf("Facebook token missing: %w", domain.ErrInvalidCredentials)
	}
	qStr := url.QueryEscape(strings.Join(query, " "))
	apiURL := fmt.Sprintf("https://graph.facebook.com/v19.0/pages/search?q=%s&access_token=%s", qStr, token)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("facebook request build error: %w", domain.ErrUpstreamError)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("facebook graph api network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("facebook auth error: %w", domain.ErrInvalidCredentials)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("facebook API error status %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data struct {
		Data []struct {
			ID       string `json:"id"`
			Name     string `json:"name"`
			Link     string `json:"link"`
			Category string `json:"category"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("facebook json parse error: %w", domain.ErrUpstreamError)
	}
	signals := make([]domain.MonitorSignal, 0, len(data.Data))
	for _, item := range data.Data {
		signals = append(signals, domain.MonitorSignal{
			SignalID:   item.ID,
			TenantID:   tenantID,
			Platform:   domain.PlatformFacebook,
			SourceID:   item.ID,
			Author:     item.Name,
			Content:    fmt.Sprintf("Facebook page signal: %s (%s)", item.Name, item.Category),
			URL:        item.Link,
			Engagement: 100,
			Velocity:   15.0,
			DetectedAt: time.Now().UTC(),
			Metadata:   map[string]string{"category": item.Category},
		})
	}
	return signals, nil
}

// ITEM 1: Instagram JSON Response Parsing
type instagramGraphResponse struct {
	Data []struct {
		ID            string `json:"id"`
		Caption       string `json:"caption"`
		Permalink     string `json:"permalink"`
		Timestamp     string `json:"timestamp"`
		LikeCount     int    `json:"like_count"`
		CommentsCount int    `json:"comments_count"`
	} `json:"data"`
	Paging struct {
		Cursors struct {
			After string `json:"after"`
		} `json:"cursors"`
	} `json:"paging"`
}

type InstagramClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewInstagramClient(tokenMgr *TokenManager) *InstagramClient {
	return &InstagramClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *InstagramClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformInstagram)
	if err != nil || token == "" {
		return nil, fmt.Errorf("INSTAGRAM token error: %w", domain.ErrInvalidCredentials)
	}
	qStr := url.QueryEscape(strings.Join(query, ","))
	apiURL := fmt.Sprintf("https://graph.instagram.com/tags/%s/media/top?fields=id,caption,permalink,timestamp,like_count,comments_count&access_token=%s", qStr, token)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("instagram request build error: %w", domain.ErrUpstreamError)
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("instagram api network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("instagram auth error: %w", domain.ErrInvalidCredentials)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("instagram API error status %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data instagramGraphResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to parse instagram JSON: %w", domain.ErrUpstreamError)
	}

	signals := make([]domain.MonitorSignal, 0, len(data.Data))
	for _, item := range data.Data {
		eng := item.LikeCount + item.CommentsCount
		ts, err := time.Parse(time.RFC3339, item.Timestamp)
		if err != nil {
			ts = time.Now().UTC()
		}
		meta := map[string]string{"api": "instagram_graph_v1"}
		if data.Paging.Cursors.After != "" {
			meta["after_cursor"] = data.Paging.Cursors.After
		}
		signals = append(signals, domain.MonitorSignal{
			SignalID:   item.ID,
			TenantID:   tenantID,
			Platform:   domain.PlatformInstagram,
			SourceID:   item.ID,
			Author:     "@ig_account",
			Content:    item.Caption,
			URL:        item.Permalink,
			Engagement: eng,
			Velocity:   float64(eng) / 10.0,
			DetectedAt: ts,
			Metadata:   meta,
		})
	}

	return signals, nil
}

// ITEM 2: TikTok JSON Response Parsing
type tiktokResearchResponse struct {
	Data struct {
		Videos []struct {
			ID               string `json:"id"`
			VideoDescription string `json:"video_description"`
			ShareURL         string `json:"share_url"`
			CreateTime       int64  `json:"create_time"`
			LikeCount        int    `json:"like_count"`
			CommentCount     int    `json:"comment_count"`
			ShareCount       int    `json:"share_count"`
		} `json:"videos"`
		Cursor  int64 `json:"cursor"`
		HasMore bool  `json:"has_more"`
	} `json:"data"`
}

type TikTokClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewTikTokClient(tokenMgr *TokenManager) *TikTokClient {
	return &TikTokClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *TikTokClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformTikTok)
	if err != nil || token == "" {
		return nil, fmt.Errorf("TikTok token missing: %w", domain.ErrInvalidCredentials)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, "https://open.tiktokapis.com/v2/research/video/query/", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("tiktok network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("tiktok auth error: %w", domain.ErrInvalidCredentials)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("tiktok api error %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data tiktokResearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to parse tiktok JSON: %w", domain.ErrUpstreamError)
	}

	signals := make([]domain.MonitorSignal, 0, len(data.Data.Videos))
	for _, vid := range data.Data.Videos {
		eng := vid.LikeCount + vid.CommentCount + vid.ShareCount
		ts := time.Unix(vid.CreateTime, 0).UTC()
		signals = append(signals, domain.MonitorSignal{
			SignalID:   vid.ID,
			TenantID:   tenantID,
			Platform:   domain.PlatformTikTok,
			SourceID:   vid.ID,
			Author:     "@tiktok_creator",
			Content:    vid.VideoDescription,
			URL:        vid.ShareURL,
			Engagement: eng,
			Velocity:   float64(eng) / 15.0,
			DetectedAt: ts,
			Metadata: map[string]string{
				"api":      "tiktok_research_v2",
				"cursor":   fmt.Sprintf("%d", data.Data.Cursor),
				"has_more": fmt.Sprintf("%v", data.Data.HasMore),
			},
		})
	}

	return signals, nil
}

// ITEM 3: LinkedIn JSON Response Parsing
type linkedinShareResponse struct {
	Elements []struct {
		ID                   string `json:"id"`
		Commentary           string `json:"commentary"`
		Permalink            string `json:"permalink"`
		Created              struct {
			Time int64 `json:"time"`
		} `json:"created"`
		TotalShareStatistics struct {
			LikeCount    int `json:"likeCount"`
			CommentCount int `json:"commentCount"`
			ShareCount   int `json:"shareCount"`
		} `json:"totalShareStatistics"`
	} `json:"elements"`
}

type LinkedInClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewLinkedInClient(tokenMgr *TokenManager) *LinkedInClient {
	return &LinkedInClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *LinkedInClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformLinkedIn)
	if err != nil || token == "" {
		return nil, fmt.Errorf("LinkedIn credentials missing: %w", domain.ErrInvalidCredentials)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, "https://api.linkedin.com/v2/shares?q=owners", nil)
	if err != nil {
		return nil, err
	}
	req.Header.Set("Authorization", "Bearer "+token)
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("linkedin network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()
	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("linkedin auth error: %w", domain.ErrInvalidCredentials)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("linkedin api error %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data linkedinShareResponse
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("failed to parse linkedin JSON: %w", domain.ErrUpstreamError)
	}

	signals := make([]domain.MonitorSignal, 0, len(data.Elements))
	for _, item := range data.Elements {
		stats := item.TotalShareStatistics
		eng := stats.LikeCount + stats.CommentCount + stats.ShareCount
		ts := time.UnixMilli(item.Created.Time).UTC()
		signals = append(signals, domain.MonitorSignal{
			SignalID:   item.ID,
			TenantID:   tenantID,
			Platform:   domain.PlatformLinkedIn,
			SourceID:   item.ID,
			Author:     "LinkedIn Member",
			Content:    item.Commentary,
			URL:        item.Permalink,
			Engagement: eng,
			Velocity:   float64(eng) / 8.0,
			DetectedAt: ts,
			Metadata:   map[string]string{"api": "linkedin_share_v2"},
		})
	}

	return signals, nil
}

type YouTubeClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewYouTubeClient(tokenMgr *TokenManager) *YouTubeClient {
	return &YouTubeClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *YouTubeClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformYouTube)
	if err != nil || token == "" {
		return nil, fmt.Errorf("YOUTUBE_API_KEY empty: %w", domain.ErrInvalidCredentials)
	}
	qStr := url.QueryEscape(strings.Join(query, "|"))
	apiURL := fmt.Sprintf("https://www.googleapis.com/youtube/v3/search?part=snippet&q=%s&type=video&key=%s", qStr, token)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("youtube network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
		return nil, fmt.Errorf("youtube auth error: %w", domain.ErrInvalidCredentials)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("youtube api error %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data struct {
		Items []struct {
			ID struct {
				VideoID string `json:"videoId"`
			} `json:"id"`
			Snippet struct {
				Title        string    `json:"title"`
				Description  string    `json:"description"`
				ChannelTitle string    `json:"channelTitle"`
				PublishedAt  time.Time `json:"publishedAt"`
			} `json:"snippet"`
		} `json:"items"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("youtube parse error: %w", domain.ErrUpstreamError)
	}
	signals := make([]domain.MonitorSignal, 0, len(data.Items))
	for _, item := range data.Items {
		signals = append(signals, domain.MonitorSignal{
			SignalID:   item.ID.VideoID,
			TenantID:   tenantID,
			Platform:   domain.PlatformYouTube,
			SourceID:   item.Snippet.ChannelTitle,
			Author:     item.Snippet.ChannelTitle,
			Content:    fmt.Sprintf("%s - %s", item.Snippet.Title, item.Snippet.Description),
			URL:        fmt.Sprintf("https://www.youtube.com/watch?v=%s", item.ID.VideoID),
			Engagement: 500,
			Velocity:   40.0,
			DetectedAt: item.Snippet.PublishedAt,
			Metadata:   map[string]string{"video_id": item.ID.VideoID},
		})
	}
	return signals, nil
}

type RedditClient struct {
	tokenMgr   *TokenManager
	httpClient *http.Client
}

func NewRedditClient(tokenMgr *TokenManager) *RedditClient {
	return &RedditClient{
		tokenMgr:   tokenMgr,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

func (c *RedditClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	token, err := c.tokenMgr.GetToken(ctx, domain.PlatformReddit)
	if err != nil || token == "" {
		return nil, fmt.Errorf("Reddit credentials missing: %w", domain.ErrInvalidCredentials)
	}
	qStr := url.QueryEscape(strings.Join(query, " "))
	apiURL := fmt.Sprintf("https://www.reddit.com/search.json?q=%s&sort=new&limit=25", qStr)

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, err
	}
	clientID := os.Getenv("REDDIT_CLIENT_ID")
	req.SetBasicAuth(clientID, token)
	req.Header.Set("User-Agent", "agbofa-nexus-ai-monitor/1.0.0")

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("reddit network error: %w", domain.ErrUpstreamTimeout)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusUnauthorized {
		return nil, fmt.Errorf("reddit auth error: %w", domain.ErrInvalidCredentials)
	}
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("reddit api error %d: %w", resp.StatusCode, domain.ErrUpstreamError)
	}

	var data struct {
		Data struct {
			Children []struct {
				Data struct {
					ID        string  `json:"id"`
					Title     string  `json:"title"`
					Author    string  `json:"author"`
					URL       string  `json:"url"`
					Score     int     `json:"score"`
					CreatedUTC float64 `json:"created_utc"`
				} `json:"data"`
			} `json:"children"`
		} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&data); err != nil {
		return nil, fmt.Errorf("reddit parse error: %w", domain.ErrUpstreamError)
	}
	signals := make([]domain.MonitorSignal, 0, len(data.Data.Children))
	for _, child := range data.Data.Children {
		item := child.Data
		ts := time.Unix(int64(item.CreatedUTC), 0).UTC()
		signals = append(signals, domain.MonitorSignal{
			SignalID:   item.ID,
			TenantID:   tenantID,
			Platform:   domain.PlatformReddit,
			SourceID:   item.Author,
			Author:     "u/" + item.Author,
			Content:    item.Title,
			URL:        item.URL,
			Engagement: item.Score,
			Velocity:   float64(item.Score) / 5.0,
			DetectedAt: ts,
			Metadata:   map[string]string{"reddit_id": item.ID},
		})
	}
	return signals, nil
}

type EmergingClient struct {
	rssFeeds   []string
	httpClient *http.Client
}

func NewEmergingClient() *EmergingClient {
	feedStr := os.Getenv("EMERGING_RSS_FEEDS")
	var feeds []string
	if feedStr != "" {
		feeds = strings.Split(feedStr, ",")
	} else {
		feeds = []string{}
	}
	return &EmergingClient{
		rssFeeds:   feeds,
		httpClient: &http.Client{Timeout: 10 * time.Second},
	}
}

type rssFeedXML struct {
	Channel struct {
		Items []struct {
			Title       string `xml:"title"`
			Link        string `xml:"link"`
			Description string `xml:"description"`
			PubDate     string `xml:"pubDate"`
			Author      string `xml:"author"`
		} `xml:"item"`
	} `xml:"channel"`
}

func (c *EmergingClient) FetchSignals(ctx context.Context, tenantID string, query []string) ([]domain.MonitorSignal, error) {
	if len(c.rssFeeds) == 0 {
		return nil, fmt.Errorf("EMERGING_RSS_FEEDS empty: %w", domain.ErrInvalidCredentials)
	}

	signals := make([]domain.MonitorSignal, 0)
	for i, feedURL := range c.rssFeeds {
		req, err := http.NewRequestWithContext(ctx, http.MethodGet, feedURL, nil)
		if err != nil {
			log.Printf("WARN [EmergingClient]: invalid rss feed URL %s: %v", feedURL, err)
			continue
		}
		resp, err := c.httpClient.Do(req)
		if err != nil {
			log.Printf("WARN [EmergingClient]: failed to fetch RSS %s: %v", feedURL, err)
			continue
		}
		if resp.StatusCode != http.StatusOK {
			resp.Body.Close()
			continue
		}
		var feed rssFeedXML
		body, _ := io.ReadAll(resp.Body)
		resp.Body.Close()

		if err := xml.Unmarshal(body, &feed); err != nil {
			continue
		}

		for j, item := range feed.Channel.Items {
			signals = append(signals, domain.MonitorSignal{
				SignalID:   fmt.Sprintf("rss-%d-%d", i, j),
				TenantID:   tenantID,
				Platform:   domain.PlatformEmerging,
				SourceID:   feedURL,
				Author:     item.Author,
				Content:    fmt.Sprintf("%s: %s", item.Title, item.Description),
				URL:        item.Link,
				Engagement: 50,
				Velocity:   10.0,
				DetectedAt: time.Now().UTC(),
				Metadata:   map[string]string{"feed_url": feedURL},
			})
		}
	}
	return signals, nil
}

type PlatformAPIClient struct {
	rateLimiter application.RateLimiter
	tokenMgr    *TokenManager
	twitter     *TwitterClient
	facebook    *FacebookClient
	instagram   *InstagramClient
	tiktok      *TikTokClient
	linkedin    *LinkedInClient
	youtube     *YouTubeClient
	reddit      *RedditClient
	emerging    *EmergingClient
}

func NewPlatformAPIClient(limiter application.RateLimiter) *PlatformAPIClient {
	tokenMgr := NewTokenManager("")
	return &PlatformAPIClient{
		rateLimiter: limiter,
		tokenMgr:    tokenMgr,
		twitter:     NewTwitterClient(tokenMgr),
		facebook:    NewFacebookClient(tokenMgr),
		instagram:   NewInstagramClient(tokenMgr),
		tiktok:      NewTikTokClient(tokenMgr),
		linkedin:    NewLinkedInClient(tokenMgr),
		youtube:     NewYouTubeClient(tokenMgr),
		reddit:      NewRedditClient(tokenMgr),
		emerging:    NewEmergingClient(),
	}
}

func (c *PlatformAPIClient) FetchSignals(ctx context.Context, tenantID string, platform domain.PlatformSource, keywords []string) ([]domain.MonitorSignal, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if !platform.IsValid() {
		return nil, domain.ErrInvalidPlatform
	}

	switch platform {
	case domain.PlatformTwitter:
		return c.twitter.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformFacebook:
		return c.facebook.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformInstagram:
		return c.instagram.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformTikTok:
		return c.tiktok.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformLinkedIn:
		return c.linkedin.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformYouTube:
		return c.youtube.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformReddit:
		return c.reddit.FetchSignals(ctx, tenantID, keywords)
	case domain.PlatformEmerging, domain.PlatformRSS:
		return c.emerging.FetchSignals(ctx, tenantID, keywords)
	default:
		return nil, domain.ErrInvalidPlatform
	}
}
