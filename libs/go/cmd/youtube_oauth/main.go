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

// Create OAuth manager
oauth := youtube.NewOAuthManager(config)

// Generate auth URL
authURL := oauth.GetAuthURL("test-state")
fmt.Println("\n=== YouTube OAuth Setup ===\n")
fmt.Println("1. Open this URL in your browser:")
fmt.Println(authURL)
fmt.Println("\n2. Authorize the application")
fmt.Println("3. You will be redirected to:", config.RedirectURI)
fmt.Println("4. Copy the 'code' parameter from the URL")
fmt.Print("\nEnter the authorization code: ")

var code string
fmt.Scanln(&code)

// Exchange code for tokens
ctx := context.Background()
cred, err := oauth.ExchangeCode(ctx, code)
if err != nil {
log.Fatalf("Failed to exchange code: %v", err)
}

fmt.Println("\n=== Tokens Obtained ===")
fmt.Printf("Access Token: %s...\n", cred.AccessToken[:20])
fmt.Printf("Refresh Token: %s...\n", cred.RefreshToken[:20])
fmt.Printf("Expires At: %s\n", cred.ExpiresAt)
fmt.Printf("Scopes: %v\n", cred.Scopes)

// Save refresh token to file for future use
err = os.WriteFile("refresh_token.txt", []byte(cred.RefreshToken), 0600)
if err != nil {
log.Fatalf("Failed to save refresh token: %v", err)
}
fmt.Println("\n✅ Refresh token saved to refresh_token.txt")
fmt.Println("Add this to your .env as YOUTUBE_REFRESH_TOKEN")
}
