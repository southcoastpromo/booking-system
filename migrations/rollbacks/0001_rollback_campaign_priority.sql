-- Rollback: Remove priority field from campaigns
-- Created: 2025-10-23
-- Rolls back: 0001_add_campaign_priority.sql

-- Remove index first
DROP INDEX IF EXISTS "idx_campaigns_priority";

-- Remove priority column
ALTER TABLE "campaigns" DROP COLUMN IF EXISTS "priority";
