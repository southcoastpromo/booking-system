-- Migration: Add priority field to campaigns for sorting
-- Created: 2025-10-23
-- Author: Production Hardening Sprint

-- Add priority column with default value
ALTER TABLE "campaigns" 
ADD COLUMN IF NOT EXISTS "priority" INTEGER DEFAULT 0 NOT NULL;

-- Add index for efficient sorting by priority
CREATE INDEX IF NOT EXISTS "idx_campaigns_priority" 
ON "campaigns"("priority" DESC);

-- Add comment for documentation
COMMENT ON COLUMN "campaigns"."priority" IS 'Campaign display priority (higher number = higher priority)';

-- Update existing campaigns to default priority
UPDATE "campaigns" SET "priority" = 0 WHERE "priority" IS NULL;
