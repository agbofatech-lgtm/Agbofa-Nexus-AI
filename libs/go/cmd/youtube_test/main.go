package main

import (
"context"
"fmt"
"log"
"os"

youtube "github.com/agbofa/nexus/libs/go/pkg/connectors/youtube"
)

func main() {
// Load config
config, err := youtube.LoadConfigFromEnv()
if err != nil {
log.Fatal(err)
}

// Create credential store
store := youtube.NewInMemoryCredentialStore()

// Create OAuth manager
oauth := youtube.NewOAuthManager(config)

// Refresh token to get access token
ctx := context.Background()
cred, err := oauth.RefreshToken(ctx, os.Getenv("YOUTUBE_REFRESH_TOKEN"))
if err != nil {
log.Fatalf("Failed to refresh token: %v", err)
}

// Set tenant info
cred.TenantID = "default"
cred.Platform = youtube.PlatformName

// Save to store
if err := store.Save(ctx, *cred); err != nil {
log.Fatalf("Failed to save credential: %v", err)
}

// Create connector
conn, err := youtube.New(config.APIKey, store)
if err != nil {
log.Fatalf("Failed to create connector: %v", err)
}

// Test: Get channel info
fmt.Println("\n=== Testing YouTube Connection ===")
_, err = conn.GetChannelInfo(ctx, "default")
if err != nil {
log.Fatalf("Failed to get channel info: %v", err)
}
fmt.Printf("✅ Channel Info retrieved successfully\n")

// Test: Create a playlist
playlistID, err := conn.CreatePlaylist(ctx, "default", "Test Playlist", "Created via Agbofa Nexus", "private")
if err != nil {
log.Fatalf("Failed to create playlist: %v", err)
}
fmt.Printf("✅ Created playlist: %s\n", playlistID)

fmt.Println("\n✅ YouTube connection test successful!")
}
