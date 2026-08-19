DROP INDEX IF EXISTS refresh_tokens_family_id_idx;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS used_at;
ALTER TABLE refresh_tokens DROP COLUMN IF EXISTS family_id;
