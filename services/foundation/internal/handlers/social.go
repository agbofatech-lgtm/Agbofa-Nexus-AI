package handlers

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type SocialHTTP struct {
	Store    *repositories.SocialStore
	Jobs     *repositories.DistStore
	Box      *social.TokenBox
	Adapters *social.Router
	Autonomy publishingAutonomyStore
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
	if h.Box == nil {
		writeErr(w, http.StatusServiceUnavailable, "oauth_unconfigured")
		return
	}
	if req.Redirect == "" {
		req.Redirect = social.RedirectURI(spec.ID)
	}
	if err := social.RedirectAllowed(spec.ID, req.Redirect); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_oauth")
		return
	}
	st, err := social.NewOAuthState(principal.TenantID, principal.SubjectID, spec.ID, req.Redirect, 10*time.Minute)
	if err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_oauth")
		return
	}
	verEnc, err := h.Box.Seal(st.Verifier)
	if err != nil {
		writeErr(w, http.StatusServiceUnavailable, "oauth_unconfigured")
		return
	}
	if err := h.Store.SaveState(r.Context(), repositories.OAuthStateRow{
		Hash: st.Hash, TenantID: st.TenantID, UserID: st.UserID, Platform: string(st.Platform),
		Redirect: st.Redirect, VerifierEnc: verEnc, ExpiresAt: st.ExpiresAt,
	}); err != nil {
		writeErr(w, http.StatusInternalServerError, "state_persist")
		return
	}
	clientID := social.ClientID(spec.ID)
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
	code := r.URL.Query().Get("code")
	if r.Body != nil && (rawState == "" || code == "") {
		var body struct {
			State string `json:"state"`
			Code  string `json:"code"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		if rawState == "" {
			rawState = body.State
		}
		if code == "" {
			code = body.Code
		}
	}
	if rawState == "" {
		writeErr(w, http.StatusForbidden, "oauth_state_missing")
		return
	}
	if strings.TrimSpace(code) == "" {
		writeErr(w, http.StatusBadRequest, "oauth_code_missing")
		return
	}
	if h.Box == nil {
		writeErr(w, http.StatusServiceUnavailable, "oauth_unconfigured")
		return
	}
	row, err := h.Store.ConsumeState(r.Context(), social.HashOpaque(rawState), principal.TenantID, principal.SubjectID)
	if err != nil {
		code := "oauth_state_denied"
		switch {
		case errors.Is(err, social.ErrReplayState):
			code = "oauth_state_replay"
		case errors.Is(err, social.ErrStateTenant):
			code = "oauth_state_tenant"
		case errors.Is(err, social.ErrStateUser):
			code = "oauth_state_user"
		case errors.Is(err, social.ErrExpiredState):
			code = "oauth_state_expired"
		case errors.Is(err, social.ErrInvalidState):
			code = "oauth_state_unknown"
		}
		log.Printf("social callback: consume failed class=%s tenant_set=%t", code, principal.TenantID != "")
		writeErr(w, http.StatusForbidden, code)
		return
	}
	stored := social.OAuthState{Hash: row.Hash, TenantID: row.TenantID, UserID: row.UserID, Platform: social.Platform(row.Platform), Redirect: row.Redirect, ExpiresAt: row.ExpiresAt}
	if err := social.ValidateCallback(stored, rawState, principal.TenantID, principal.SubjectID, time.Now().UTC()); err != nil {
		writeErr(w, http.StatusForbidden, "oauth_state_denied")
		return
	}
	verifier, err := h.Box.Open(row.VerifierEnc)
	if err != nil {
		writeErr(w, http.StatusForbidden, "oauth_state_denied")
		return
	}
	adapter := h.adapter(social.Platform(row.Platform))
	tokens, err := adapter.Exchange(r.Context(), code, row.Redirect, verifier)
	if err != nil || tokens.AccessToken == "" {
		log.Printf("social callback: exchange failed platform=%s", row.Platform)
		writeErr(w, http.StatusBadGateway, "oauth_exchange_failed")
		return
	}
	accountID, accountName := tokens.AccountID, tokens.AccountName
	if ident, ok := adapter.(social.Identifier); ok {
		id, name, identErr := ident.Identify(r.Context(), tokens)
		if identErr != nil {
			writeErr(w, http.StatusBadGateway, "oauth_identity_failed")
			return
		}
		accountID, accountName = id, name
	}
	if accountID == "" {
		writeErr(w, http.StatusBadGateway, "oauth_identity_failed")
		return
	}
	encAccess, err := h.Box.Seal(tokens.AccessToken)
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "token_seal_failed")
		return
	}
	encRefresh := ""
	if tokens.RefreshToken != "" {
		encRefresh, err = h.Box.Seal(tokens.RefreshToken)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, "token_seal_failed")
			return
		}
	}
	var exp *time.Time
	if !tokens.ExpiresAt.IsZero() {
		e := tokens.ExpiresAt
		exp = &e
	}
	conn, err := h.Store.UpsertConnection(r.Context(), repositories.Connection{
		TenantID: principal.TenantID, UserID: principal.SubjectID, Platform: row.Platform,
		ProviderAccountID: accountID, AccountName: accountName, Status: "CONNECTED",
		EncAccess: encAccess, EncRefresh: encRefresh, Scopes: strings.Join(tokens.Scopes, " "),
		ExpiresAt: exp,
	})
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "connection_persist")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "SOCIAL_ACCOUNT_CONNECTED", row.Platform, conn.ID, "", "", r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{
		"connected":           true,
		"status":              "CONNECTED",
		"platform":            row.Platform,
		"account_id":          conn.ID,
		"provider_account_id": conn.ProviderAccountID,
		"account_name":        conn.AccountName,
	})
}

func (h SocialHTTP) adapter(p social.Platform) social.Adapter {
	if h.Adapters != nil {
		if a, ok := h.Adapters.For(p); ok {
			return a
		}
	}
	if p == social.PlatformYouTube {
		return social.NewYouTubeAdapter(nil)
	}
	spec, _ := social.Lookup(string(p))
	return social.OAuthClient{Spec: spec, ClientID: social.ClientID(p), ClientSec: social.ClientSecret(p)}
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
	var req struct {
		AccountID      string `json:"account_id"`
		ContentID      string `json:"content_id"`
		ContentVersion string `json:"content_version"`
		Body           string `json:"body"`
		BrandApplied   bool   `json:"brand_identity_applied"`
		ScheduledAt    string `json:"scheduled_at"`
		MediaURL       string `json:"media_url"`
		Approve        bool   `json:"approved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	var scheduled *time.Time
	if req.ScheduledAt != "" {
		parsed, err := time.Parse(time.RFC3339, req.ScheduledAt)
		if err != nil {
			writeErr(w, http.StatusBadRequest, "invalid_schedule")
			return
		}
		scheduled = &parsed
	}
	out, err := publishingBoundary{Connections: h.Store, Jobs: h.Jobs, Autonomy: h.Autonomy}.Submit(r.Context(), publishCommand{
		Principal:      principal,
		ConnectionID:   req.AccountID,
		ContentID:      req.ContentID,
		ContentVersion: req.ContentVersion,
		Body:           req.Body,
		MediaURL:       req.MediaURL,
		BrandApplied:   req.BrandApplied,
		ScheduledAt:    scheduled,
		Approved:       req.Approve,
		CorrelationID:  r.Header.Get("X-Correlation-ID"),
		AuditAction:    "DISTRIBUTION_CREATED",
	})
	if err == social.ErrDuplicateJob {
		writeJSON(w, http.StatusOK, map[string]any{"idempotent": true, "idempotency_key": out.IdempotencyKey})
		return
	}
	if writePublishBoundaryError(w, err) {
		return
	}
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "job_create")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"job_id": out.Job.ID, "status": out.Job.Status, "brand_applied": true, "published": false})
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
