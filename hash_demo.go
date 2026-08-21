package main
import (
  "fmt"
  "github.com/agbofa/nexus/libs/go/pkg/auth"
)
func main() {
  h, err := auth.HashPassword("demo")
  if err != nil { panic(err) }
  fmt.Print(h)
}
