#!/bin/sh
set -e

SRC_DIR="/data"
SRC_DB="$SRC_DIR/bot.db"
SRC_WAL="$SRC_DIR/bot.db-wal"
SRC_SHM="$SRC_DIR/bot.db-shm"

DST_DIR="/backups"
mkdir -p "$DST_DIR"

if [ -f "$SRC_DB" ]; then
  TS=$(date +"%Y-%m-%d_%H-%M-%S")
  BACKUP_BASENAME="bot_$TS"
  BACKUP_DB="$DST_DIR/${BACKUP_BASENAME}.db"

  # Копируем основной файл
  cp "$SRC_DB" "$BACKUP_DB"

  # Копируем WAL и SHM, если есть
  if [ -f "$SRC_WAL" ]; then
    cp "$SRC_WAL" "$DST_DIR/${BACKUP_BASENAME}.db-wal"
    echo "[Backup] WAL copied: ${BACKUP_BASENAME}.db-wal"
  fi

  if [ -f "$SRC_SHM" ]; then
    cp "$SRC_SHM" "$DST_DIR/${BACKUP_BASENAME}.db-shm"
    echo "[Backup] SHM copied: ${BACKUP_BASENAME}.db-shm"
  fi

  echo "[Backup] Saved $BACKUP_DB"

  # Чистим старые бэкапы (старше 7 дней)
  find "$DST_DIR" -type f \( -name "bot_*.db" -o -name "bot_*.db-wal" -o -name "bot_*.db-shm" \) -mtime +7 -delete
else
  echo "[Backup] No DB file found at $SRC_DB"
fi
