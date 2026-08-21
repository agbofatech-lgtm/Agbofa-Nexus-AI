package autonomy

import (
	"testing"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

func TestAllowPlaneTestAuthMatrix(t *testing.T) {
	if AllowPlaneTestAuth(config.EnvTest, true, "") {
		t.Fatal("empty")
	}
	if AllowPlaneTestAuth(config.EnvTest, true, "nope") {
		t.Fatal("invalid")
	}
	if !AllowPlaneTestAuth(config.EnvTest, true, TestBearerToken) {
		t.Fatal("test env")
	}
	if !AllowPlaneTestAuth(config.EnvDevelopment, true, TestBearerToken) {
		t.Fatal("dev env")
	}
	if AllowPlaneTestAuth(config.EnvProduction, true, TestBearerToken) {
		t.Fatal("production must reject")
	}
	if AllowPlaneTestAuth(config.EnvStaging, true, TestBearerToken) {
		t.Fatal("staging must reject")
	}
	if AllowPlaneTestAuth(config.EnvTest, false, TestBearerToken) {
		t.Fatal("flag off")
	}
}
