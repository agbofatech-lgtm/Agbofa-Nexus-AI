package infrastructure

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"sync"
	"time"

	"github.com/agbofa/nexus/services/monetization/internal/application"
	"github.com/agbofa/nexus/services/monetization/internal/domain"
)

var _ application.AdRepository = (*PostgresAdRepository)(nil)
var _ application.AdImpressionRepository = (*PostgresAdRepository)(nil)

// PostgresAdRepository implements application.AdRepository and application.AdImpressionRepository
// backed by PostgreSQL with non-negotiable Row-Level Security (RLS) enforcement.
type PostgresAdRepository struct {
	mu          sync.RWMutex
	dbURL       string
	db          *sql.DB
	campaigns   map[string]*domain.AdCampaign
	placements  map[string]*domain.AdPlacement
	impressions map[string]*domain.AdImpression
}

// NewPostgresAdRepository creates a new PostgresAdRepository.
func NewPostgresAdRepository(dbURL string) *PostgresAdRepository {
	if dbURL == "" {
		dbURL = os.Getenv("DATABASE_URL")
	}
	var db *sql.DB
	if dbURL != "" {
		var err error
		db, err = sql.Open("postgres", dbURL)
		if err != nil {
			log.Printf("WARN [PostgresAdRepository]: invalid DATABASE_URL: %v", err)
			db = nil
		}
	}
	return &PostgresAdRepository{
		dbURL:       dbURL,
		db:          db,
		campaigns:   make(map[string]*domain.AdCampaign),
		placements:  make(map[string]*domain.AdPlacement),
		impressions: make(map[string]*domain.AdImpression),
	}
}

// SaveCampaign saves an AdCampaign with RLS enforcement.
func (r *PostgresAdRepository) SaveCampaign(ctx context.Context, tenantID string, campaign *domain.AdCampaign) error {
	if tenantID == "" || campaign == nil || campaign.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return err
		}

		platformsBytes, _ := json.Marshal(campaign.TargetPlatforms)
		topicsBytes, _ := json.Marshal(campaign.TargetTopics)
		constraintsBytes, _ := json.Marshal(campaign.Constraints)

		query := `
			INSERT INTO ad_campaigns (
				campaign_id, tenant_id, advertiser_id, name, budget, currency,
				start_date, end_date, target_platforms, target_topics, constraints, status,
				created_at, updated_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
			ON CONFLICT (campaign_id) DO UPDATE SET
				name = EXCLUDED.name,
				budget = EXCLUDED.budget,
				currency = EXCLUDED.currency,
				start_date = EXCLUDED.start_date,
				end_date = EXCLUDED.end_date,
				target_platforms = EXCLUDED.target_platforms,
				target_topics = EXCLUDED.target_topics,
				constraints = EXCLUDED.constraints,
				status = EXCLUDED.status,
				updated_at = EXCLUDED.updated_at
			WHERE ad_campaigns.tenant_id = $2
		`
		now := time.Now().UTC()
		_, err = tx.ExecContext(ctx, query,
			campaign.CampaignID, campaign.TenantID, campaign.AdvertiserID, campaign.Name,
			campaign.Budget, campaign.Currency, campaign.StartDate, campaign.EndDate,
			platformsBytes, topicsBytes, constraintsBytes, string(campaign.Status),
			now, now,
		)
		if err != nil {
			return fmt.Errorf("SaveCampaign SQL error: %w", err)
		}
		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.campaigns[campaign.CampaignID] = campaign
	return nil
}

// GetCampaign retrieves an AdCampaign by ID with RLS enforcement.
func (r *PostgresAdRepository) GetCampaign(ctx context.Context, tenantID, campaignID string) (*domain.AdCampaign, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if campaignID == "" {
		return nil, domain.ErrAdCampaignNotFound
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		query := `
			SELECT campaign_id, tenant_id, advertiser_id, name, budget, currency,
			       start_date, end_date, target_platforms, target_topics, constraints, status
			FROM ad_campaigns
			WHERE campaign_id = $1 AND tenant_id = $2
		`
		row := tx.QueryRowContext(ctx, query, campaignID, tenantID)
		camp := &domain.AdCampaign{}
		var statusStr string
		var platformsBytes, topicsBytes, constraintsBytes []byte
		err = row.Scan(
			&camp.CampaignID, &camp.TenantID, &camp.AdvertiserID, &camp.Name, &camp.Budget, &camp.Currency,
			&camp.StartDate, &camp.EndDate, &platformsBytes, &topicsBytes, &constraintsBytes, &statusStr,
		)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrAdCampaignNotFound
		} else if err != nil {
			return nil, fmt.Errorf("GetCampaign SQL error: %w", err)
		}
		camp.Status = domain.CampaignStatus(statusStr)
		_ = json.Unmarshal(platformsBytes, &camp.TargetPlatforms)
		_ = json.Unmarshal(topicsBytes, &camp.TargetTopics)
		_ = json.Unmarshal(constraintsBytes, &camp.Constraints)
		_ = tx.Commit()
		return camp, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	camp, ok := r.campaigns[campaignID]
	if !ok {
		return nil, domain.ErrAdCampaignNotFound
	}
	if camp.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return camp, nil
}

// ListActiveCampaigns returns all campaigns with ACTIVE status for a tenant.
func (r *PostgresAdRepository) ListActiveCampaigns(ctx context.Context, tenantID string) ([]*domain.AdCampaign, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		query := `
			SELECT campaign_id, tenant_id, advertiser_id, name, budget, currency,
			       start_date, end_date, target_platforms, target_topics, constraints, status
			FROM ad_campaigns
			WHERE tenant_id = $1 AND status = 'ACTIVE'
		`
		rows, err := tx.QueryContext(ctx, query, tenantID)
		if err != nil {
			return nil, fmt.Errorf("ListActiveCampaigns SQL error: %w", err)
		}
		defer rows.Close()

		var list []*domain.AdCampaign
		for rows.Next() {
			camp := &domain.AdCampaign{}
			var statusStr string
			var platformsBytes, topicsBytes, constraintsBytes []byte
			if err := rows.Scan(
				&camp.CampaignID, &camp.TenantID, &camp.AdvertiserID, &camp.Name, &camp.Budget, &camp.Currency,
				&camp.StartDate, &camp.EndDate, &platformsBytes, &topicsBytes, &constraintsBytes, &statusStr,
			); err != nil {
				return nil, err
			}
			camp.Status = domain.CampaignStatus(statusStr)
			_ = json.Unmarshal(platformsBytes, &camp.TargetPlatforms)
			_ = json.Unmarshal(topicsBytes, &camp.TargetTopics)
			_ = json.Unmarshal(constraintsBytes, &camp.Constraints)
			list = append(list, camp)
		}
		_ = tx.Commit()
		return list, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	var list []*domain.AdCampaign
	for _, camp := range r.campaigns {
		if camp.TenantID == tenantID && camp.Status == domain.CampaignStatusActive {
			list = append(list, camp)
		}
	}
	return list, nil
}

// SavePlacement saves an AdPlacement with RLS enforcement.
func (r *PostgresAdRepository) SavePlacement(ctx context.Context, tenantID string, placement *domain.AdPlacement) error {
	if tenantID == "" || placement == nil || placement.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return err
		}

		query := `
			INSERT INTO ad_placements (
				placement_id, tenant_id, campaign_id, content_id, platform,
				placement_type, cpm, cpc, status, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (placement_id) DO UPDATE SET
				cpm = EXCLUDED.cpm,
				cpc = EXCLUDED.cpc,
				status = EXCLUDED.status
			WHERE ad_placements.tenant_id = $2
		`
		_, err = tx.ExecContext(ctx, query,
			placement.PlacementID, placement.TenantID, placement.CampaignID, placement.ContentID,
			placement.Platform, string(placement.PlacementType), placement.CPM, placement.CPC,
			placement.Status, placement.CreatedAt,
		)
		if err != nil {
			return fmt.Errorf("SavePlacement SQL error: %w", err)
		}
		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.placements[placement.PlacementID] = placement
	return nil
}

// GetPlacement retrieves an AdPlacement by ID with RLS enforcement.
func (r *PostgresAdRepository) GetPlacement(ctx context.Context, tenantID, placementID string) (*domain.AdPlacement, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if placementID == "" {
		return nil, domain.ErrAdPlacementNotFound
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		query := `
			SELECT placement_id, tenant_id, campaign_id, content_id, platform,
			       placement_type, cpm, cpc, status, created_at
			FROM ad_placements
			WHERE placement_id = $1 AND tenant_id = $2
		`
		row := tx.QueryRowContext(ctx, query, placementID, tenantID)
		p := &domain.AdPlacement{}
		var typeStr string
		err = row.Scan(
			&p.PlacementID, &p.TenantID, &p.CampaignID, &p.ContentID, &p.Platform,
			&typeStr, &p.CPM, &p.CPC, &p.Status, &p.CreatedAt,
		)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, domain.ErrAdPlacementNotFound
		} else if err != nil {
			return nil, fmt.Errorf("GetPlacement SQL error: %w", err)
		}
		p.PlacementType = domain.PlacementType(typeStr)
		_ = tx.Commit()
		return p, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	p, ok := r.placements[placementID]
	if !ok {
		return nil, domain.ErrAdPlacementNotFound
	}
	if p.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return p, nil
}

// RecordImpression records or updates an AdImpression with RLS enforcement.
func (r *PostgresAdRepository) RecordImpression(ctx context.Context, tenantID string, imp *domain.AdImpression) error {
	if tenantID == "" || imp == nil || imp.TenantID != tenantID {
		return domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return err
		}

		query := `
			INSERT INTO ad_impressions (
				impression_id, tenant_id, placement_id, reader_id,
				served_at, clicked, clicked_at, revenue, currency, created_at
			) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
			ON CONFLICT (impression_id) DO UPDATE SET
				clicked = EXCLUDED.clicked,
				clicked_at = EXCLUDED.clicked_at,
				revenue = EXCLUDED.revenue
			WHERE ad_impressions.tenant_id = $2
		`
		_, err = tx.ExecContext(ctx, query,
			imp.ImpressionID, imp.TenantID, imp.PlacementID, imp.ReaderID,
			imp.ServedAt, imp.Clicked, imp.ClickedAt, imp.Revenue, imp.Currency, time.Now().UTC(),
		)
		if err != nil {
			return fmt.Errorf("RecordImpression SQL error: %w", err)
		}
		return tx.Commit()
	}

	r.mu.Lock()
	defer r.mu.Unlock()
	r.impressions[imp.ImpressionID] = imp
	return nil
}

// GetImpression retrieves an existing AdImpression by ID with RLS enforcement.
func (r *PostgresAdRepository) GetImpression(ctx context.Context, tenantID, impressionID string) (*domain.AdImpression, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}
	if impressionID == "" {
		return nil, errors.New("impression_id cannot be empty")
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		query := `
			SELECT impression_id, tenant_id, placement_id, reader_id,
			       served_at, clicked, clicked_at, revenue, currency
			FROM ad_impressions
			WHERE impression_id = $1 AND tenant_id = $2
		`
		row := tx.QueryRowContext(ctx, query, impressionID, tenantID)
		imp := &domain.AdImpression{}
		var clickedAt sql.NullTime
		err = row.Scan(
			&imp.ImpressionID, &imp.TenantID, &imp.PlacementID, &imp.ReaderID,
			&imp.ServedAt, &imp.Clicked, &clickedAt, &imp.Revenue, &imp.Currency,
		)
		if errors.Is(err, sql.ErrNoRows) {
			return nil, errors.New("impression not found")
		} else if err != nil {
			return nil, fmt.Errorf("GetImpression SQL error: %w", err)
		}
		if clickedAt.Valid {
			t := clickedAt.Time
			imp.ClickedAt = &t
		}
		_ = tx.Commit()
		return imp, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	imp, ok := r.impressions[impressionID]
	if !ok {
		return nil, errors.New("impression not found")
	}
	if imp.TenantID != tenantID {
		return nil, domain.ErrCrossTenantViolation
	}
	return imp, nil
}

// GetRecentImpression checks for deduplication: finds a recent impression for reader+placement since timestamp.
func (r *PostgresAdRepository) GetRecentImpression(ctx context.Context, tenantID, placementID, readerID string, since time.Time) (*domain.AdImpression, error) {
	if tenantID == "" {
		return nil, domain.ErrCrossTenantViolation
	}

	if r.db != nil {
		tx, err := r.db.BeginTx(ctx, nil)
		if err != nil {
			return nil, err
		}
		defer func() { _ = tx.Rollback() }()

		if err := setTenantRLS(ctx, tx, tenantID); err != nil {
			return nil, err
		}

		query := `
			SELECT impression_id, tenant_id, placement_id, reader_id,
			       served_at, clicked, clicked_at, revenue, currency
			FROM ad_impressions
			WHERE tenant_id = $1 AND placement_id = $2 AND reader_id = $3 AND served_at >= $4
			ORDER BY served_at DESC
			LIMIT 1
		`
		row := tx.QueryRowContext(ctx, query, tenantID, placementID, readerID, since)
		imp := &domain.AdImpression{}
		var clickedAt sql.NullTime
		err = row.Scan(
			&imp.ImpressionID, &imp.TenantID, &imp.PlacementID, &imp.ReaderID,
			&imp.ServedAt, &imp.Clicked, &clickedAt, &imp.Revenue, &imp.Currency,
		)
		if errors.Is(err, sql.ErrNoRows) {
			_ = tx.Commit()
			return nil, nil
		} else if err != nil {
			return nil, fmt.Errorf("GetRecentImpression SQL error: %w", err)
		}
		if clickedAt.Valid {
			t := clickedAt.Time
			imp.ClickedAt = &t
		}
		_ = tx.Commit()
		return imp, nil
	}

	r.mu.RLock()
	defer r.mu.RUnlock()
	for _, imp := range r.impressions {
		if imp.TenantID == tenantID && imp.PlacementID == placementID && imp.ReaderID == readerID {
			if imp.ServedAt.After(since) {
				return imp, nil
			}
		}
	}
	return nil, nil
}
