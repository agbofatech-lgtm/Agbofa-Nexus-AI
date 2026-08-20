package handlers

import (
	"encoding/json"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type SocialHTTP struct {
	Store *repositories.SocialStore
	Jobs  *repositories.DistStore
	Box   *social.TokenBox
}

func (h SocialHTTP) Connect(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		Platform string `json:"platform"`
		Redirect string `json:"redirect_uri"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	spec, ok := social.Lookup(req.Platform)
	if !ok {
		writeErr(w, http.StatusBadRequest, "unknown_platform")
		return
	}
	st, err := social.NewOAuthState(principal.TenantID, principal.SubjectID, spec.ID, req.Redirect, 10*time.Minute)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_oauth")
		return
	}
	verEnc := st.Verifier
	if h.Box != nil {
		if sealed, err := h.Box.Seal(st.Verifier); err == nil {
			verEnc = sealed
		}
	}
	if err := h.Store.SaveState(r.Context(), repositories.OAuthStateRow{
		Hash: st.Hash, TenantID: st.TenantID, UserID: st.UserID, Platform: string(st.Platform),
		Redirect: st.Redirect, VerifierEnc: verEnc, ExpiresAt: st.ExpiresAt,
	}); err != nil {
		writeErr(w, http.StatusInternalServerError, "state_persist")
		return
	}
	clientID := os.Getenv("AGBOFA_OAUTH_" + strings.ToUpper(string(spec.ID)) + "_CLIENT_ID")
	authURL, err := social.AuthorizationURL(spec, clientID, req.Redirect, st.Raw, st.Challenge)
	if err != nil {
		writeErr(w, http.StatusServiceUnavailable, "oauth_unconfigured")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "SOCIAL_ACCOUNT_CONNECT_STARTED", string(spec.ID), "", "", "", r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"authorization_url": authURL, "platform": spec.ID})
}

func (h SocialHTTP) Callback(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	rawState := r.URL.Query().Get("state")
	if rawState == "" && r.Body != nil {
		var body struct {
			State string `json:"state"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		rawState = body.State
	}
	if rawState == "" {
		writeErr(w, http.StatusForbidden, "oauth_state_missing")
		return
	}
	row, err := h.Store.ConsumeState(r.Context(), social.HashOpaque(rawState))
	if err != nil {
		writeErr(w, http.StatusForbidden, "oauth_state_denied")
		return
	}
	stored := social.OAuthState{Hash: row.Hash, TenantID: row.TenantID, UserID: row.UserID, Platform: social.Platform(row.Platform), Redirect: row.Redirect, ExpiresAt: row.ExpiresAt}
	if err := social.ValidateCallback(stored, rawState, principal.TenantID, principal.SubjectID, time.Now().UTC()); err != nil {
		writeErr(w, http.StatusForbidden, "oauth_state_denied")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{
		"connected": false,
		"status":    "PENDING_CODE_EXCHANGE",
		"platform":  row.Platform,
		"note":      "authorization code accepted only after official token exchange; tokens are never returned",
	})
}

func (h SocialHTTP) Accounts(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	list, err := h.Store.ListConnections(r.Context(), principal.TenantID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "list_failed")
		return
	}
	safe := make([]map[string]any, 0, len(list))
	for _, c := range list {
		safe = append(safe, map[string]any{
			"id": c.ID, "platform": c.Platform, "account_name": c.AccountName,
			"provider_account_id": c.ProviderAccountID, "status": c.Status, "scopes": c.Scopes,
		})
	}
	writeJSON(w, http.StatusOK, map[string]any{"accounts": safe})
}

func (h SocialHTTP) Disconnect(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil || req.ID == "" {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	if err := h.Store.Disconnect(r.Context(), principal.TenantID, req.ID); err != nil {
		writeErr(w, http.StatusNotFound, "not_found")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "SOCIAL_ACCOUNT_DISCONNECTED", "", req.ID, "", "", r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"disconnected": true})
}

func (h SocialHTTP) CreateDistribution(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	dec := authz.Decide(authz.Request{
		SubjectID: principal.SubjectID, TenantID: principal.TenantID, ResourceTenant: principal.TenantID,
		Roles: principal.Roles, Resource: "content", Action: "create",
	})
	if !dec.Allowed {
		writeErr(w, http.StatusForbidden, "unauthorized_publish")
		return
	}
	var req struct {
		AccountID      string `json:"account_id"`
		ContentID      string `json:"content_id"`
		ContentVersion string `json:"content_version"`
		Body           string `json:"body"`
		BrandApplied   bool   `json:"brand_identity_applied"`
		ScheduledAt    string `json:"scheduled_at"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	acct, err := h.Store.GetConnection(r.Context(), principal.TenantID, req.AccountID)
	if err != nil {
		writeErr(w, http.StatusForbidden, "account_denied")
		return
	}
	spec, ok := social.Lookup(acct.Platform)
	if !ok {
		writeErr(w, http.StatusBadRequest, "unknown_platform")
		return
	}
	pkg, err := social.Adapt(social.CanonicalContent{
		ID: req.ContentID, Version: req.ContentVersion, TenantID: principal.TenantID,
		Body: req.Body, BrandApplied: req.BrandApplied, AuthorID: principal.SubjectID,
	}, spec)
	if err != nil {
		if err == social.ErrBrandingRequired {
			writeErr(w, http.StatusUnprocessableEntity, "BRANDING_REQUIRED")
			return
		}
		writeErr(w, http.StatusBadRequest, "invalid_content")
		return
	}
	status := string(social.StatusQueued)
	var scheduled *time.Time
	if req.ScheduledAt != "" {
		parsed, err := time.Parse(time.RFC3339, req.ScheduledAt)
		if err != nil {
			writeErr(w, http.StatusBadRequest, "invalid_schedule")
			return
		}
		scheduled = &parsed
		status = string(social.StatusScheduled)
	}
	key := social.IdempotencyKey(principal.TenantID, req.ContentID, req.ContentVersion, acct.ID, spec.ID, req.ScheduledAt)
	job, err := h.Jobs.CreateJob(r.Context(), repositories.DistJob{
		TenantID: principal.TenantID, ActorID: principal.SubjectID, AccountID: acct.ID,
		Platform: string(spec.ID), ContentID: req.ContentID, ContentVersion: req.ContentVersion,
		IdempotencyKey: key, Status: status, ScheduledAt: scheduled, Snapshot: pkg.Text, BrandApplied: true,
	})
	if err == social.ErrDuplicateJob {
		writeJSON(w, http.StatusOK, map[string]any{"idempotent": true, "idempotency_key": key})
		return
	}
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "job_create")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "DISTRIBUTION_CREATED", string(spec.ID), acct.ID, req.ContentID, job.ID, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"job_id": job.ID, "status": job.Status, "brand_applied": true, "published": false})
}

func (h SocialHTTP) ListDistributions(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	jobs, err := h.Jobs.ListJobs(r.Context(), principal.TenantID)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "list_failed")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"jobs": jobs})
}

func (h SocialHTTP) Cancel(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		ID string `json:"id"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	job, err := h.Jobs.GetJob(r.Context(), principal.TenantID, req.ID)
	if err != nil {
		writeErr(w, http.StatusNotFound, "not_found")
		return
	}
	if err := h.Jobs.Transition(r.Context(), principal.TenantID, job.ID, job.Status, string(social.StatusCancelled), "", ""); err != nil {
		writeErr(w, http.StatusConflict, "illegal_transition")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "DISTRIBUTION_CANCELLED", job.Platform, job.AccountID, job.ContentID, job.ID, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"status": "CANCELLED"})
}
