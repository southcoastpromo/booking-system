-- Migration: Add performance indexes to email_outbox table
-- Created: 2025-10-23
-- Author: Production Hardening Sprint
-- Purpose: Optimize email worker queries for pending and failed emails

-- Index for worker queries (status + scheduled_at)
CREATE INDEX IF NOT EXISTS "idx_email_outbox_worker_query" 
ON "email_outbox"("status", "scheduled_at")
WHERE "status" IN ('pending', 'failed');

-- Index for retry logic (status + attempt_count)
CREATE INDEX IF NOT EXISTS "idx_email_outbox_retry" 
ON "email_outbox"("status", "attempt_count")
WHERE "status" = 'failed';

-- Index for cleanup queries (created_at for old records)
CREATE INDEX IF NOT EXISTS "idx_email_outbox_created_at" 
ON "email_outbox"("created_at");

-- Index for debugging/monitoring (status summary)
CREATE INDEX IF NOT EXISTS "idx_email_outbox_status" 
ON "email_outbox"("status");
