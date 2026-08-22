package server

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/auth"
	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/config"
	"github.com/agbofa/nexus/libs/go/pkg/database"
)

type ctxKey int

const (
	ctxCorrelation ctxKey = iota
	ctxClaims
)

func CorrelationID(r *http.Request) string {
	if id := r.Header.Get("X-Correlation-ID"); id != "" {
		return id
	}
	var b [8]byte
	_, _ = rand.Read(b[:])
	return hex.EncodeToString(b[:])
}

func withCorrelation(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		id := CorrelationID(r)
		w.Header().Set("X-Correlation-ID", id)
		r.Header.Set("X-Correlation-ID", id)
		next.ServeHTTP(w, r.WithContext(context.WithValue(r.Context(), ctxCorrelation, id)))
	})
}

func recoverMW(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				writeError(w, http.StatusInternalServerError, "internal")
			}
		}()
		next.ServeHTTP(w, r)
	})
}

func authenticate(verifier *auth.Verifier, public map[string]struct{}, env config.Environment, planeTestAuth bool) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			log.Printf("rpc inbound method=%s path=%s", r.Method, r.URL.Path)
			if _, ok := public[r.URL.Path]; ok {
				next.ServeHTTP(w, r)
				return
			}
			raw := bearer(r)
			if raw == "" {
				if c, err := r.Cookie(auth.AccessCookieName); err == nil {
					raw = c.Value
				}
			}
			if raw == "" {
				writeError(w, http.StatusUnauthorized, "unauthenticated")
				return
			}
			if raw == autonomy.TestBearerToken {
				if !autonomy.AllowPlaneTestAuth(env, planeTestAuth, raw) {
					writeError(w, http.StatusUnauthorized, "unauthenticated")
					return
				}
				sub, tenant, roles := autonomy.TestAuthPrincipalFor(r.Header.Get("X-Agbofa-Test-Tenant"))
				ctx := authz.WithPrincipal(r.Context(), authz.Principal{SubjectID: sub, TenantID: tenant, Roles: roles})
				ctx = database.WithTenant(ctx, tenant)
				next.ServeHTTP(w, r.WithContext(ctx))
				return
			}
			if verifier == nil {
				writeError(w, http.StatusUnauthorized, "unauthenticated")
				return
			}
			claims, err := verifier.Verify(raw)
			if err != nil {
				writeError(w, http.StatusUnauthorized, "unauthenticated")
				return
			}
			ctx := context.WithValue(r.Context(), ctxClaims, claims)
			ctx = authz.WithPrincipal(ctx, authz.Principal{SubjectID: claims.Subject, TenantID: claims.TenantID, Roles: claims.Roles})
			ctx = database.WithTenant(ctx, claims.TenantID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

func authorize(resource, action string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			principal, ok := authz.PrincipalFrom(r.Context())
			if !ok {
				writeError(w, http.StatusUnauthorized, "unauthenticated")
				return
			}
			dec := authz.Decide(authz.Request{
				SubjectID: principal.SubjectID, TenantID: principal.TenantID,
				ResourceTenant: principal.TenantID, Roles: principal.Roles,
				Resource: resource, Action: action,
			})
			if !dec.Allowed {
				writeError(w, http.StatusForbidden, "permission_denied")
				return
			}
			next.ServeHTTP(w, r)
		})
	}
}

func bearer(r *http.Request) string {
	h := r.Header.Get("Authorization")
	if strings.HasPrefix(strings.ToLower(h), "bearer ") {
		return strings.TrimSpace(h[7:])
	}
	return ""
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeError(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]any{"error": code, "status": status, "ts": time.Now().UTC().Format(time.RFC3339)})
}
