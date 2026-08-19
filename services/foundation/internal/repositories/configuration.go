package repositories

import (
	"context"
	"encoding/json"

	"github.com/agbofa/nexus/libs/go/pkg/database"
	"github.com/agbofa/nexus/services/foundation/internal/application"
)

type ConfigurationRepository struct {
	db DB
}

func NewConfigurationRepository(db DB) *ConfigurationRepository {
	return &ConfigurationRepository{db: db}
}

func (r *ConfigurationRepository) GetBundle(ctx context.Context, namespace string) (application.ConfigurationBundle, error) {
	var bundle application.ConfigurationBundle
	var raw []byte
	err := r.db.QueryRow(ctx, `
SELECT namespace, values, version
FROM configuration_bundles WHERE namespace = $1`, namespace).Scan(&bundle.Namespace, &raw, &bundle.Version)
	if err != nil {
		return application.ConfigurationBundle{}, mapDB(err)
	}
	if err := json.Unmarshal(raw, &bundle.Values); err != nil {
		return application.ConfigurationBundle{}, err
	}
	if bundle.Values == nil {
		bundle.Values = map[string]string{}
	}
	return bundle, nil
}

func (r *ConfigurationRepository) SetBundle(ctx context.Context, namespace string, values map[string]string, modifiedBy string) (application.ConfigurationBundle, []application.ConfigurationChange, error) {
	if values == nil {
		values = map[string]string{}
	}
	existing, err := r.GetBundle(ctx, namespace)
	if err != nil && err != database.ErrNotFound {
		return application.ConfigurationBundle{}, nil, err
	}
	old := map[string]string{}
	if err == nil {
		old = existing.Values
	}
	var changes []application.ConfigurationChange
	seen := map[string]struct{}{}
	for key, next := range values {
		seen[key] = struct{}{}
		prev := old[key]
		if prev != next {
			changes = append(changes, application.ConfigurationChange{Key: key, OldValue: prev, NewValue: next})
		}
	}
	for key, prev := range old {
		if _, ok := seen[key]; !ok {
			changes = append(changes, application.ConfigurationChange{Key: key, OldValue: prev, NewValue: ""})
		}
	}
	raw, err := json.Marshal(values)
	if err != nil {
		return application.ConfigurationBundle{}, nil, err
	}
	var bundle application.ConfigurationBundle
	var stored []byte
	err = r.db.QueryRow(ctx, `
INSERT INTO configuration_bundles (namespace, values, version, modified_by)
VALUES ($1, $2::jsonb, 1, $3)
ON CONFLICT (namespace) DO UPDATE
SET values = EXCLUDED.values,
    version = configuration_bundles.version + 1,
    modified_by = EXCLUDED.modified_by
RETURNING namespace, values, version`, namespace, raw, modifiedBy).Scan(&bundle.Namespace, &stored, &bundle.Version)
	if err != nil {
		return application.ConfigurationBundle{}, nil, mapDB(err)
	}
	if err := json.Unmarshal(stored, &bundle.Values); err != nil {
		return application.ConfigurationBundle{}, nil, err
	}
	for _, change := range changes {
		newValue := change.NewValue
		if newValue == "" {
			newValue = "<deleted>"
		}
		if _, err := r.db.Exec(ctx, `
INSERT INTO config_audit_log (id, namespace, config_key, old_value, new_value, modified_by, version)
VALUES ($1, $2, $3, $4, $5, $6, $7)`,
			mustID(), namespace, change.Key, nullIfEmpty(change.OldValue), newValue, modifiedBy, bundle.Version); err != nil {
			return application.ConfigurationBundle{}, nil, mapDB(err)
		}
	}
	return bundle, changes, nil
}

func mustID() string {
	id, err := newID()
	if err != nil {
		return "00000000-0000-4000-8000-000000000000"
	}
	return id
}

func nullIfEmpty(value string) any {
	if value == "" {
		return nil
	}
	return value
}
