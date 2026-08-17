package main

import (
"context"
"encoding/json"
"fmt"
"log"
"net/http"
"net/url"
"os"
"strings"
"time"
)

func main() {
code := "4/0ATsMZqAuZtfBTIvkxbEjFhzMcSqjRfOKvy5h5-pOrkTvPuyLLYQ4JA20e3JXZ_17PZ6t8A"

data := url.Values{}
data.Set("code", code)
data.Set("client_id", os.Getenv("YOUTUBE_CLIENT_ID"))
data.Set("client_secret", os.Getenv("YOUTUBE_CLIENT_SECRET"))
data.Set("redirect_uri", "http://localhost:8080/oauth/youtube/callback")
data.Set("grant_type", "authorization_code")

req, err := http.NewRequest("POST", "https://oauth2.googleapis.com/token", strings.NewReader(data.Encode()))
if err != nil {
log.Fatal(err)
}
req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

client := &http.Client{Timeout: 30 * time.Second}
resp, err := client.Do(req)
if err != nil {
log.Fatal(err)
}
defer resp.Body.Close()

if resp.StatusCode != http.StatusOK {
body := make([]byte, 1024)
n, _ := resp.Body.Read(body)
log.Fatalf("Token exchange failed with status %d: %s", resp.StatusCode, string(body[:n]))
}

var tokenResp struct {
AccessToken  string `json:"access_token"`
ExpiresIn    int    `json:"expires_in"`
RefreshToken string `json:"refresh_token"`
Scope        string `json:"scope"`
TokenType    string `json:"token_type"`
}

if err := json.NewDecoder(resp.Body).Decode(&tokenResp); err != nil {
log.Fatal(err)
}

fmt.Printf("Access Token: %s...\n", tokenResp.AccessToken[:20])
if tokenResp.RefreshToken != "" {
fmt.Printf("Refresh Token: %s...\n", tokenResp.RefreshToken[:20])
} else {
fmt.Println("Refresh Token: NOT RETURNED (already authorized previously)")
}
fmt.Printf("Full Refresh Token: %s\n", tokenResp.RefreshToken)
fmt.Printf("Expires In: %d seconds\n", tokenResp.ExpiresIn)
fmt.Printf("Scopes: %s\n", tokenResp.Scope)

// Save to file in current directory
ctx := context.Background()
_ = ctx
err = os.WriteFile("refresh_token.txt", []byte(tokenResp.RefreshToken), 0600)
if err != nil {
log.Printf("Warning: Could not save refresh token: %v", err)
} else {
fmt.Println("\n✅ Refresh token saved to refresh_token.txt")
}
}