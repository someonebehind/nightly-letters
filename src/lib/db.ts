import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const dataDir = path.join(process.cwd(), "data");
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, "letters.db");
const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT,
    image TEXT,
    nickname TEXT,
    google_id TEXT UNIQUE,
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
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
`);

try {
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  const names = cols.map((c) => c.name);
  if (!names.includes("email")) db.exec("ALTER TABLE users ADD COLUMN email TEXT");
  if (!names.includes("name")) db.exec("ALTER TABLE users ADD COLUMN name TEXT");
  if (!names.includes("image")) db.exec("ALTER TABLE users ADD COLUMN image TEXT");
  if (!names.includes("google_id")) db.exec("ALTER TABLE users ADD COLUMN google_id TEXT");
} catch (e) {
  // ignore
}

export default db;
