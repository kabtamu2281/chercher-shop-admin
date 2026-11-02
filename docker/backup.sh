#!/bin/bash
# Kpax Shop - Automated Daily Database Backup Script for Ubuntu VPS
# Developed by Kpax Technologies

BACKUP_DIR="/var/backups/kpax_shop"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
FILENAME="$BACKUP_DIR/kpax_backup_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

echo "Starting Kpax Shop PostgreSQL backup at $(date)..."
docker exec -t kpax_postgres pg_dump -U kpax_admin -d kpax_shop | gzip > $FILENAME

if [ $? -eq 0 ]; then
  echo "Backup successfully saved to $FILENAME"
  # Keep only backups from the last 30 days
  find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -exec rm {} \;
  echo "Old backups pruned."
else
  echo "ERROR: Backup failed!" >&2
  exit 1
fi
