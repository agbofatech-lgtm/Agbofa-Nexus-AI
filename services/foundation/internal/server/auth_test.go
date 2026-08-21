package server

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/config"
)

func TestAuthenticateMatrix(t *testing.T) {
	okHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		p, ok := authz.PrincipalFrom(r.Context())
		if !ok || p.SubjectID == "" {
			t.Fatal("missing principal")
		}
		w.WriteHeader(http.StatusOK)
	})

	t.Run("no auth", func(t *testing.T) {
		h := authenticate(nil, map[string]struct{}{}, config.EnvTest, true)(okHandler)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodPost, "/v1/autonomy/execute", nil))
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%d", rec.Code)
		}
	})
	t.Run("invalid token", func(t *testing.T) {
		h := authenticate(nil, map[string]struct{}{}, config.EnvTest, true)(okHandler)
		req := httptest.NewRequest(http.MethodPost, "/v1/autonomy/execute", nil)
		req.Header.Set("Authorization", "Bearer nope")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%d", rec.Code)
		}
	})
	t.Run("test token test mode", func(t *testing.T) {
		h := authenticate(nil, map[string]struct{}{}, config.EnvTest, true)(okHandler)
		req := httptest.NewRequest(http.MethodPost, "/v1/autonomy/execute", nil)
		req.Header.Set("Authorization", "Bearer "+autonomy.TestBearerToken)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusOK {
			t.Fatalf("%d %s", rec.Code, rec.Body.String())
		}
	})
	t.Run("test token production", func(t *testing.T) {
		h := authenticate(nil, map[string]struct{}{}, config.EnvProduction, true)(okHandler)
		req := httptest.NewRequest(http.MethodPost, "/v1/autonomy/execute", nil)
		req.Header.Set("Authorization", "Bearer "+autonomy.TestBearerToken)
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%d", rec.Code)
		}
	})
	t.Run("malformed header", func(t *testing.T) {
		h := authenticate(nil, map[string]struct{}{}, config.EnvTest, true)(okHandler)
		req := httptest.NewRequest(http.MethodPost, "/v1/autonomy/execute", nil)
		req.Header.Set("Authorization", "Token abc")
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, req)
		if rec.Code != http.StatusUnauthorized {
			t.Fatalf("%d", rec.Code)
		}
	})
}
