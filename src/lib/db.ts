import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "letters.db");
const db = new Database(dbPath);

// Enable WAL for better concurrency
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    nickname TEXT,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS letters (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    pen_name TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    letter_date TEXT NOT NULL,
    delivered_to TEXT,
    delivered_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (delivered_to) REFERENCES users(id)
  );

  CREATE INDEX IF NOT EXISTS idx_letters_date ON letters(letter_date);
  CREATE INDEX IF NOT EXISTS idx_letters_delivered ON letters(delivered_to);
  CREATE INDEX IF NOT EXISTS idx_letters_user_date ON letters(user_id, letter_date);
`);

export default db;
