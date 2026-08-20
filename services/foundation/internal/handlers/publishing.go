package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type PublishingHTTP struct {
	Jobs    *repositories.DistStore
	Social  *repositories.SocialStore
	Worker  *publish.Worker
}

func (h PublishingHTTP) Schedule(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		ContentID      string `json:"contentId"`
		ContentVersion string `json:"contentVersion"`
		ConnectionID   string `json:"connectionId"`
		Body           string `json:"body"`
		BrandApplied   bool   `json:"brand_identity_applied"`
		ScheduledAt    string `json:"scheduledAt"`
		Approve        bool   `json:"approved"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
		return
	}
	acct, err := h.Social.GetConnection(r.Context(), principal.TenantID, req.ConnectionID)
	if err != nil {
		writeErr(w, http.StatusForbidden, "CONNECTION_NOT_FOUND")
		return
	}
	var when *time.Time
	if req.ScheduledAt != "" {
		t, err := time.Parse(time.RFC3339, req.ScheduledAt)
		if err != nil {
			writeErr(w, http.StatusBadRequest, "SCHEDULE_INVALID")
			return
		}
		when = &t
	}
	gate := publish.Validate(publish.GateInput{
		Principal: principal, ContentID: req.ContentID, ContentVersion: firstNV(req.ContentVersion, "v1"),
		Body: req.Body, BrandApplied: req.BrandApplied, ConnectionID: acct.ID,
		ConnectionTenant: acct.TenantID, ConnectionStatus: acct.Status, Platform: acct.Platform,
		ScheduledAt: when, Now: time.Now().UTC(),
	})
	if !gate.OK {
		writeErr(w, http.StatusUnprocessableEntity, gate.Code)
		return
	}
	spec, _ := social.Lookup(acct.Platform)
	pkg, err := social.Adapt(social.CanonicalContent{
		ID: req.ContentID, Version: firstNV(req.ContentVersion, "v1"), TenantID: principal.TenantID,
		Body: req.Body, BrandApplied: true, AuthorID: principal.SubjectID,
	}, spec)
	if err != nil {
		writeErr(w, http.StatusUnprocessableEntity, "INVALID_CONTENT")
		return
	}
	status := string(publish.StatusQueued)
	if when != nil {
		status = string(publish.StatusScheduled)
	}
	if !req.Approve {
		status = string(publish.StatusPendingApproval)
	}
	schedKey := ""
	if when != nil {
		schedKey = when.UTC().Format(time.RFC3339)
	}
	key := social.IdempotencyKey(principal.TenantID, req.ContentID, firstNV(req.ContentVersion, "v1"), acct.ID, spec.ID, schedKey)
	job, err := h.Jobs.CreateJob(r.Context(), repositories.DistJob{
		TenantID: principal.TenantID, ActorID: principal.SubjectID, AccountID: acct.ID,
		Platform: string(spec.ID), ContentID: req.ContentID, ContentVersion: firstNV(req.ContentVersion, "v1"),
		IdempotencyKey: key, Status: status, ScheduledAt: when, Snapshot: pkg.Text, BrandApplied: true,
	})
	if err == social.ErrDuplicateJob {
		writeJSON(w, http.StatusOK, map[string]any{"idempotent": true, "idempotency_key": key})
		return
	}
	if err != nil {
		writeErr(w, http.StatusInternalServerError, "job_create")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "PUBLICATION_SCHEDULED", acct.Platform, acct.ID, req.ContentID, job.ID, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"jobId": job.ID, "status": job.Status, "scheduledAt": req.ScheduledAt})
}

func (h PublishingHTTP) Approve(w http.ResponseWriter, r *http.Request) {
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
	if err := h.Jobs.Approve(r.Context(), principal.TenantID, req.ID, principal.SubjectID); err != nil {
		writeErr(w, http.StatusConflict, "APPROVAL_REQUIRED")
		return
	}
	_ = h.Jobs.Audit(r.Context(), principal.TenantID, principal.SubjectID, "PUBLICATION_APPROVED", "", "", "", req.ID, r.Header.Get("X-Correlation-ID"))
	writeJSON(w, http.StatusOK, map[string]any{"status": "APPROVED"})
}

func (h PublishingHTTP) Cancel(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	var req struct {
		ID string `json:"id"`
	}
	_ = json.NewDecoder(r.Body).Decode(&req)
	job, err := h.Jobs.GetJob(r.Context(), principal.TenantID, req.ID)
	if err != nil {
		writeErr(w, http.StatusNotFound, "PUBLICATION_NOT_FOUND")
		return
	}
	if err := h.Jobs.Transition(r.Context(), principal.TenantID, job.ID, job.Status, string(publish.StatusCancelled), "", ""); err != nil {
		writeErr(w, http.StatusConflict, "illegal_transition")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"status": "CANCELLED"})
}

func (h PublishingHTTP) Tick(w http.ResponseWriter, r *http.Request) {
	if h.Worker == nil {
		writeErr(w, http.StatusServiceUnavailable, "WORKER_UNAVAILABLE")
		return
	}
	if err := h.Worker.Tick(r.Context()); err != nil {
		writeErr(w, http.StatusInternalServerError, "WORKER_ERROR")
		return
	}
	writeJSON(w, http.StatusOK, map[string]any{"ticked": true})
}

func (h PublishingHTTP) Get(w http.ResponseWriter, r *http.Request) {
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	id := r.URL.Query().Get("id")
	job, err := h.Jobs.GetJob(r.Context(), principal.TenantID, id)
	if err != nil {
		writeErr(w, http.StatusNotFound, "PUBLICATION_NOT_FOUND")
		return
	}
	writeJSON(w, http.StatusOK, job)
}

func firstNV(v, fallback string) string {
	if v == "" {
		return fallback
	}
	return v
}
