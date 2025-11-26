#!/usr/bin/env bash
#
# Database Restore Script for SouthCoast ProMotion
#
# This script restores a PostgreSQL database from a backup file created by backup-database.sh.
# It can restore from local backups or download from S3.
#
# Usage:
#   ./scripts/restore-database.sh <backup-file> [--confirm]
#   ./scripts/restore-database.sh --from-s3 <s3-key> [--confirm]
#   ./scripts/restore-database.sh --latest [--confirm]
#
# Examples:
#   ./scripts/restore-database.sh backups/southcoast_backup_20250929_120000.sql.gz --confirm
#   ./scripts/restore-database.sh --latest --confirm
#   ./scripts/restore-database.sh --from-s3 backups/southcoast_backup_20250929_120000.sql.gz --confirm
#
# Environment Variables Required:
#   DATABASE_URL - PostgreSQL connection string
#   BACKUP_S3_BUCKET - (Optional) S3 bucket for backup retrieval
#
# Exit codes:
#   0 - Success
#   1 - Missing required arguments or environment variables
#   2 - Backup file not found
#   3 - Restore failed
#   4 - User cancelled operation

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TEMP_DIR="/tmp/southcoast_restore_$$"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

log_prompt() {
  echo -e "${BLUE}[PROMPT]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
  log_info "Checking prerequisites..."
  
  if [ -z "${DATABASE_URL:-}" ]; then
    log_error "DATABASE_URL environment variable is not set"
    exit 1
  fi
  
  if ! command -v psql &> /dev/null; then
    log_error "psql command not found"
    log_info "Please install PostgreSQL client tools"
    exit 1
  fi
  
  log_info "Prerequisites check passed"
}

# Parse command-line arguments
parse_arguments() {
  if [ $# -eq 0 ]; then
    log_error "No backup file specified"
    echo ""
    echo "Usage:"
    echo "  $0 <backup-file> [--confirm]"
    echo "  $0 --latest [--confirm]"
    echo "  $0 --from-s3 <s3-key> [--confirm]"
    exit 1
  fi
  
  BACKUP_FILE=""
  RESTORE_FROM_S3=false
  CONFIRMED=false
  
  while [[ $# -gt 0 ]]; do
    case $1 in
      --latest)
        BACKUP_FILE=$(find "$BACKUP_DIR" -name "southcoast_backup_*.sql.gz" -type f -printf '%T@ %p\n' | sort -rn | head -1 | cut -d' ' -f2)
        if [ -z "$BACKUP_FILE" ]; then
          log_error "No backup files found in $BACKUP_DIR"
          exit 2
        fi
        log_info "Latest backup selected: $(basename "$BACKUP_FILE")"
        shift
        ;;
      --from-s3)
        RESTORE_FROM_S3=true
        shift
        S3_KEY="$1"
        shift
        ;;
      --confirm)
        CONFIRMED=true
        shift
        ;;
      *)
        BACKUP_FILE="$1"
        shift
        ;;
    esac
  done
}

# Download from S3 if needed
download_from_s3() {
  if [ "$RESTORE_FROM_S3" = true ]; then
    log_info "Downloading backup from S3..."
    
    if [ -z "${BACKUP_S3_BUCKET:-}" ]; then
      log_error "BACKUP_S3_BUCKET not set for S3 restore"
      exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
      log_error "AWS CLI not found"
      exit 1
    fi
    
    mkdir -p "$TEMP_DIR"
    BACKUP_FILE="${TEMP_DIR}/$(basename "$S3_KEY")"
    
    log_info "Downloading from: s3://${BACKUP_S3_BUCKET}/${S3_KEY}"
    if ! aws s3 cp "s3://${BACKUP_S3_BUCKET}/${S3_KEY}" "$BACKUP_FILE"; then
      log_error "Failed to download backup from S3"
      exit 2
    fi
    
    log_info "Download complete: $BACKUP_FILE"
  fi
}

# Verify backup file exists
verify_backup_file() {
  if [ ! -f "$BACKUP_FILE" ]; then
    log_error "Backup file not found: $BACKUP_FILE"
    exit 2
  fi
  
  BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
  log_info "Backup file: $(basename "$BACKUP_FILE")"
  log_info "Backup size: $BACKUP_SIZE"
}

# Confirm restore operation
confirm_restore() {
  if [ "$CONFIRMED" = true ]; then
    return 0
  fi
  
  echo ""
  log_warn "============================================"
  log_warn "WARNING: DATABASE RESTORE OPERATION"
  log_warn "============================================"
  log_warn "This operation will:"
  log_warn "  1. DROP all existing tables and data"
  log_warn "  2. Restore database from backup"
  log_warn "  3. OVERWRITE current data permanently"
  echo ""
  
  # Extract database name
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
  log_warn "Target database: ${DB_NAME:-<unknown>}"
  log_warn "Backup file: $(basename "$BACKUP_FILE")"
  echo ""
  
  log_prompt "Are you sure you want to continue? Type 'yes' to proceed: "
  read -r RESPONSE
  
  if [ "$RESPONSE" != "yes" ]; then
    log_info "Restore operation cancelled by user"
    exit 4
  fi
  
  log_info "Restore confirmed by user"
}

# Perform database restore
perform_restore() {
  log_info "Starting database restore..."
  log_info "This may take several minutes depending on database size"
  echo ""
  
  # Decompress and restore
  if gunzip < "$BACKUP_FILE" | psql "$DATABASE_URL" 2>&1; then
    log_info "Database restore completed successfully"
  else
    log_error "Database restore failed"
    exit 3
  fi
}

# Cleanup temporary files
cleanup() {
  if [ -d "$TEMP_DIR" ]; then
    log_info "Cleaning up temporary files..."
    rm -rf "$TEMP_DIR"
  fi
}

# Print summary
print_summary() {
  echo ""
  log_info "============================================"
  log_info "RESTORE SUMMARY"
  log_info "============================================"
  log_info "Backup file: $(basename "$BACKUP_FILE")"
  log_info "Database: $(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')"
  log_info "Status: SUCCESS"
  log_info "============================================"
  echo ""
  log_info "Next steps:"
  log_info "  1. Verify data integrity"
  log_info "  2. Run application smoke tests"
  log_info "  3. Check logs for any errors"
}

# Main execution
main() {
  log_info "SouthCoast ProMotion - Database Restore"
  echo ""
  
  parse_arguments "$@"
  check_prerequisites
  download_from_s3
  verify_backup_file
  confirm_restore
  perform_restore
  cleanup
  print_summary
  
  log_info "Restore process completed successfully"
  exit 0
}

# Set trap for cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"
