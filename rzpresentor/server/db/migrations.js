import db from './connection.js';

export function runMigrations() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      is_admin INTEGER NOT NULL DEFAULT 0,
      is_locked INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS presentations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    INSERT OR IGNORE INTO settings (key, value) VALUES ('allow_registration', 'true');
  `);

  // Add slug and public columns to presentations table
  // SQLite can't ALTER TABLE ADD COLUMN with UNIQUE, so we add the column first
  // then create a unique index separately
  try {
    db.exec(`ALTER TABLE presentations ADD COLUMN slug TEXT;`);
  } catch (err) {
    // Column already exists on re-run
  }

  try {
    db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_presentations_slug ON presentations(slug);`);
  } catch (err) {
    // Index already exists
  }

  try {
    db.exec(`ALTER TABLE presentations ADD COLUMN public INTEGER DEFAULT 0;`);
  } catch (err) {
    // Column already exists on re-run
  }
}
