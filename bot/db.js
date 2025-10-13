// db.js (ESM)
import Database from 'better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';

const dbPath = process.env.SQLITE_PATH || path.join(process.cwd(), 'data', 'bot.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

// Режимы для продакшена на VPS
db.pragma('journal_mode = WAL');   // параллелизм чтений
db.pragma('synchronous = NORMAL'); // баланс скорость/надёжность
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 3000');

// Миграция (создание таблиц)
db.exec(`
  CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY,
    telegram_id INTEGER UNIQUE NOT NULL,
    firstname TEXT NOT NULL,
    lastname  TEXT NOT NULL,
    phone     TEXT NOT NULL,
    company   TEXT NOT NULL,
    activity_type TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_reg_created_at ON registrations(created_at);
`);

// Подготовленные выражения
const upsertStmt = db.prepare(`
  INSERT INTO registrations (telegram_id, firstname, lastname, phone, company, activity_type)
  VALUES (@telegram_id, @firstname, @lastname, @phone, @company, @activity_type)
  ON CONFLICT(telegram_id) DO UPDATE SET
    firstname=excluded.firstname,
    lastname=excluded.lastname,
    phone=excluded.phone,
    company=excluded.company,
    activity_type=excluded.activity_type
`);

const getByTgIdStmt = db.prepare(`SELECT * FROM registrations WHERE telegram_id = ?`);
const countStmt = db.prepare(`SELECT COUNT(1) as c FROM registrations`);

export function saveRegistration(payload) {
  // payload: { telegram_id, firstname, lastname, phone, company, activity_type }
  upsertStmt.run(payload);
}

export function getRegistration(telegramId) {
  return getByTgIdStmt.get(telegramId);
}

export function getTotalCount() {
  const row = countStmt.get();
  return row?.c ?? 0;
}
