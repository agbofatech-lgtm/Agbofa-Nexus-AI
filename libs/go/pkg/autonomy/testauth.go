package autonomy

import (
	"strings"

	"github.com/agbofa/nexus/libs/go/pkg/config"
)

// TestBearerToken is a non-production fixture. It is never a valid production credential.
const TestBearerToken = "test-token-123"

// AllowPlaneTestAuth accepts the development test bearer only when
// PLANE_TEST_AUTH is enabled and the environment is not production/staging.
func AllowPlaneTestAuth(env config.Environment, planeTestAuth bool, token string) bool {
	if !planeTestAuth {
		return false
	}
	if env == config.EnvProduction || env == config.EnvStaging {
		return false
	}
	return strings.TrimSpace(token) == TestBearerToken
}

func TestAuthPrincipal() (subject, tenant string, roles []string) {
	return "test-actor", "tenant-a", []string{"TENANT_ADMIN"}
}
