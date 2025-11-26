#!/usr/bin/env bash
#
# Database Backup Script for SouthCoast ProMotion
# 
# This script creates a compressed PostgreSQL database backup using pg_dump.
# Backups are timestamped and can be stored locally or uploaded to S3.
#
# Usage:
#   ./scripts/backup-database.sh [--local|--s3]
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#   BACKUP_S3_BUCKET - (Optional) S3 bucket for backup storage
#
# Exit codes:
#   0 - Success
#   1 - Missing DATABASE_URL
#   2 - pg_dump failed
#   3 - S3 upload failed

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILENAME="southcoast_backup_${TIMESTAMP}.sql.gz"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILENAME}"
STORAGE_MODE="${1:-local}" # local or s3

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is not set"
    log_info "Please set DATABASE_URL to your PostgreSQL connection string"
    exit 1
  fi
  
  if ! command -v pg_dump &> /dev/null; then
    log_error "pg_dump command not found"
    log_info "Please install PostgreSQL client tools"
    exit 1
  fi
  
  if [ "$STORAGE_MODE" = "s3" ]; then
    if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
      log_error "BACKUP_S3_BUCKET not set for S3 storage mode"
      exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
      log_error "AWS CLI not found for S3 uploads"
      log_info "Please install AWS CLI or use --local mode"
      exit 1
    fi
  fi
  
  log_info "Prerequisites check passed"
}

# Create backup directory
ensure_backup_directory() {
  if [ ! -d "$BACKUP_DIR" ]; then
    log_info "Creating backup directory: $BACKUP_DIR"
    mkdir -p "$BACKUP_DIR"
  fi
}

# Perform database backup
perform_backup() {
  log_info "Starting database backup..."
  log_info "Backup file: $BACKUP_FILENAME"
  
  # Extract database name from DATABASE_URL for logging
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  log_info "Database: ${DB_NAME:-<unknown>}"
  
  # Perform backup with compression
  if pg_dump "$DATABASE_URL" --clean --if-exists --verbose 2>&1 | gzip > "$BACKUP_PATH"; then
    BACKUP_SIZE=$(du -h "$BACKUP_PATH" | cut -f1)
    log_info "Backup completed successfully"
    log_info "Backup size: $BACKUP_SIZE"
    log_info "Backup location: $BACKUP_PATH"
  else
    log_error "Database backup failed"
    rm -f "$BACKUP_PATH" # Clean up partial backup
    exit 2
  fi
}

# Upload to S3 (if enabled)
upload_to_s3() {
  if [ "$STORAGE_MODE" = "s3" ]; then
    log_info "Uploading backup to S3..."
    log_info "Bucket: s3://${BACKUP_S3_BUCKET}/backups/"
    
    if aws s3 cp "$BACKUP_PATH" "s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_FILENAME}" \
      --storage-class STANDARD_IA \
      --metadata "created=$(date -Iseconds),env=${NODE_ENV:-production}"; then
      log_info "S3 upload completed successfully"
      log_info "S3 URI: s3://${BACKUP_S3_BUCKET}/backups/${BACKUP_FILENAME}"
    else
      log_error "S3 upload failed"
      exit 3
    fi
  fi
}

# Cleanup old backups (keep last 7 days locally)
cleanup_old_backups() {
  log_info "Cleaning up old backups..."
  
  # Remove backups older than 7 days
  find "$BACKUP_DIR" -name "southcoast_backup_*.sql.gz" -type f -mtime +7 -delete
  
  REMAINING_COUNT=$(find "$BACKUP_DIR" -name "southcoast_backup_*.sql.gz" -type f | wc -l)
  log_info "Local backups retained: $REMAINING_COUNT"
}

# Print summary
print_summary() {
  echo ""
  log_info "============================================"
  log_info "BACKUP SUMMARY"
  log_info "============================================"
  log_info "Timestamp: $TIMESTAMP"
  log_info "Backup file: $BACKUP_FILENAME"
  log_info "Location: $BACKUP_PATH"
  
  if [ "$STORAGE_MODE" = "s3" ]; then
    log_info "S3 storage: Enabled"
    log_info "S3 bucket: ${BACKUP_S3_BUCKET}"
  else
    log_info "S3 storage: Disabled"
  fi
  
  log_info "============================================"
  echo ""
}

# Main execution
main() {
  log_info "SouthCoast ProMotion - Database Backup"
  log_info "Storage mode: $STORAGE_MODE"
  echo ""
  
  check_prerequisites
  ensure_backup_directory
  perform_backup
  upload_to_s3
  cleanup_old_backups
  print_summary
  
  log_info "Backup process completed successfully"
  exit 0
}

# Run main function
main
