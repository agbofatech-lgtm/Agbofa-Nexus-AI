package handlers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/agbofa/nexus/services/foundation/internal/application"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type IdentityHTTP struct {
	Svc     *application.TenantIdentityService
	Tenants *repositories.TenantRepository
}

func (h IdentityHTTP) AuthenticateUser(w http.ResponseWriter, r *http.Request) {
	var req struct {
		TenantName    string `json:"tenant_name"`
		PrincipalName string `json:"principal_name"`
		Credential    string `json:"credential"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	tenant, err := h.Tenants.FindTenantByName(r.Context(), strings.TrimSpace(req.TenantName))
	if err != nil || tenant == nil {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	tokens, err := h.Svc.AuthenticateUser(r.Context(), *tenant, req.PrincipalName, req.Credential)
	if err != nil {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"access_token": tokens.AccessToken, "refresh_token": tokens.RefreshToken, "expires_in": tokens.ExpiresIn,
	})
}

func (h IdentityHTTP) ValidateToken(w http.ResponseWriter, r *http.Request) {
	writeErr(w, http.StatusNotImplemented, "use_bff_session")
}

func (h IdentityHTTP) GetTenant(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimSpace(r.URL.Query().Get("id"))
	if id == "" {
		var body struct {
			ID string `json:"id"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err == nil {
			id = strings.TrimSpace(body.ID)
		}
	}
	if id == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	tenant, err := h.Tenants.GetTenant(r.Context(), id)
	if err != nil {
		writeErr(w, http.StatusNotFound, "not_found")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"id": tenant.ID, "name": tenant.Name, "status": tenant.Status,
	})
}

func writeJSON(w http.ResponseWriter, status int, body any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_ = json.NewEncoder(w).Encode(body)
}

func writeErr(w http.ResponseWriter, status int, code string) {
	writeJSON(w, status, map[string]string{"error": code})
}
