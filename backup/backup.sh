#!/bin/sh
set -e

SRC_DB="/data/bot.db"
DST_DIR="/backups"

mkdir -p "$DST_DIR"

if [ -f "$SRC_DB" ]; then
  TS=$(date +"%Y-%m-%d_%H-%M-%S")
  cp "$SRC_DB" "$DST_DIR/bot_$TS.db"
  echo "[Backup] Saved $DST_DIR/bot_$TS.db"

  # Удаляем старше 7 дней
  find "$DST_DIR" -type f -name "bot_*.db" -mtime +7 -delete
else
  echo "[Backup] No DB file found at $SRC_DB"
fi
