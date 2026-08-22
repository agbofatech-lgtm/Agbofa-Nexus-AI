package handlers

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/agbofa/nexus/libs/go/pkg/authz"
	"github.com/agbofa/nexus/libs/go/pkg/autonomy"
	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/libs/go/pkg/publish"
	"github.com/agbofa/nexus/libs/go/pkg/social"
	"github.com/agbofa/nexus/services/foundation/internal/repositories"
)

type PublishingHTTP struct {
	Jobs        *repositories.DistStore
	Social      *repositories.SocialStore
	Worker      *publish.Worker
	Autonomy    publishingAutonomyStore
	TickTimeout time.Duration
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
		MediaURL       string `json:"media_url"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeErr(w, http.StatusBadRequest, "invalid_argument")
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
	out, err := publishingBoundary{Connections: h.Social, Jobs: h.Jobs, Autonomy: h.Autonomy}.Submit(r.Context(), publishCommand{
		Principal:      principal,
		ConnectionID:   req.ConnectionID,
		ContentID:      req.ContentID,
		ContentVersion: req.ContentVersion,
		Body:           req.Body,
		MediaURL:       req.MediaURL,
		BrandApplied:   req.BrandApplied,
		ScheduledAt:    when,
		Approved:       req.Approve,
		CorrelationID:  r.Header.Get("X-Correlation-ID"),
		AuditAction:    "PUBLICATION_SCHEDULED",
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
	writeJSON(w, http.StatusOK, map[string]any{"jobId": out.Job.ID, "status": out.Job.Status, "scheduledAt": req.ScheduledAt})
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
	principal, ok := authz.PrincipalFrom(r.Context())
	if !ok {
		writeErr(w, http.StatusUnauthorized, "unauthenticated")
		return
	}
	if h.Autonomy != nil {
		_, kill, err := h.Autonomy.DomainLevel(r.Context(), principal.TenantID, autonomy.DomainPublishing)
		if err != nil {
			writeErr(w, http.StatusServiceUnavailable, "PUBLISH_POLICY_UNAVAILABLE")
			return
		}
		if kill == autonomy.KillEngaged {
			writeErr(w, http.StatusLocked, "KILL_SWITCH_ENGAGED")
			return
		}
	}
	runCtx := database.WithTenant(context.Background(), principal.TenantID)
	timeout := h.TickTimeout
	if timeout <= 0 {
		timeout = 110 * time.Second
	}
	runCtx, cancel := context.WithTimeout(runCtx, timeout)
	defer cancel()
	if err := h.Worker.Tick(runCtx); err != nil {
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
