#!/bin/bash
# Kpax Shop - Database Restore Script
# Usage: ./restore.sh /var/backups/kpax_shop/kpax_backup_YYYYMMDD_HHMMSS.sql.gz

if [ -z "$1" ]; then
  echo "Usage: $0 <path_to_backup.sql.gz>"
  exit 1
fi

BACKUP_FILE="$1"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "Error: File $BACKUP_FILE does not exist."
  exit 1
fi

echo "WARNING: Restoring will overwrite existing data in kpax_shop database."
read -p "Are you sure you want to proceed? (y/N): " CONFIRM
if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Restoring from $BACKUP_FILE..."
  gunzip -c "$BACKUP_FILE" | docker exec -i kpax_postgres psql -U kpax_admin -d kpax_shop
  echo "Restore completed successfully."
else
  echo "Restore cancelled."
fi
