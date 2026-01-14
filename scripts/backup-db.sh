#!/bin/bash

# Database backup script for Docker PostgreSQL
# Usage: ./scripts/backup-db.sh

set -e

# Configuration
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="datacenter-postgres"
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.sql"

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "❌ .env file not found!"
    exit 1
fi

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Starting database backup..."
echo "📦 Container: $CONTAINER_NAME"
echo "📁 Backup file: $BACKUP_FILE"

# Create backup
docker exec -t "$CONTAINER_NAME" pg_dump \
    -U "${POSTGRES_USER:-datacenter}" \
    -d "${POSTGRES_DB:-datacenter_db}" \
    --clean --if-exists \
    > "$BACKUP_FILE"

# Compress backup
gzip "$BACKUP_FILE"

echo "✅ Backup completed: ${BACKUP_FILE}.gz"
echo "📊 File size: $(du -h ${BACKUP_FILE}.gz | cut -f1)"

# Keep only last 7 backups
echo "🧹 Cleaning old backups (keeping last 7)..."
ls -t "$BACKUP_DIR"/backup_*.sql.gz | tail -n +8 | xargs -r rm --

echo "✅ Backup process completed successfully!"
