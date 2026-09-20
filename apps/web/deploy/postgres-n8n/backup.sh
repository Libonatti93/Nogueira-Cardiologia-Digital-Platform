#!/usr/bin/env bash
set -euo pipefail
umask 077

BACKUP_DIR="/opt/nogueira-postgres/backups"
TS="$(date +%F-%H%M%S)"

mkdir -p "$BACKUP_DIR"

docker exec nogueira-postgres sh -ec 'export PGPASSWORD="$(cat /run/secrets/postgres_admin_password)"; exec pg_dump -U nogueira_admin -d nogueira_app'  | gzip > "$BACKUP_DIR/nogueira_app-$TS.sql.gz"
docker exec nogueira-postgres sh -ec 'export PGPASSWORD="$(cat /run/secrets/postgres_admin_password)"; exec pg_dump -U nogueira_admin -d n8n'  | gzip > "$BACKUP_DIR/n8n-$TS.sql.gz"

find "$BACKUP_DIR" -type f -name '*.sql.gz' -mtime +14 -delete
