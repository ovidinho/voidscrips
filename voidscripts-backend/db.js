const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'voidscripts.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS scripts (
    id TEXT PRIMARY KEY,
    game TEXT NOT NULL,
    category TEXT NOT NULL,
    image TEXT,
    source TEXT,
    code TEXT NOT NULL,
    free INTEGER NOT NULL DEFAULT 1,
    updatedFlag INTEGER NOT NULL DEFAULT 1,
    broken INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  );
`);

module.exports = db;
