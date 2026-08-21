package main
import (
  "fmt"
  "github.com/agbofa/nexus/libs/go/pkg/auth"
)
func main() {
  h, err := auth.HashPassword("password123")
  if err != nil { panic(err) }
  fmt.Print(h)
}
