-- Rollback: Remove email_outbox performance indexes
-- Created: 2025-10-23
-- Rolls back: 0002_create_email_outbox_indexes.sql

DROP INDEX IF EXISTS "idx_email_outbox_worker_query";
DROP INDEX IF EXISTS "idx_email_outbox_retry";
DROP INDEX IF EXISTS "idx_email_outbox_created_at";
DROP INDEX IF EXISTS "idx_email_outbox_status";
