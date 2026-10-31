const path = require('path');
const fs = require('fs');

let DatabaseSync;
try {
  DatabaseSync = require('node:sqlite').DatabaseSync;
} catch (err) {
  // Fallback if node:sqlite is not found
  try {
    const BetterSqlite3 = require('better-sqlite3');
    DatabaseSync = BetterSqlite3;
  } catch (e) {
    throw new Error('No SQLite driver available. Requires Node.js 22.5+ (node:sqlite) or better-sqlite3.');
  }
}

const DEFAULT_DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'canteen.db');

class SQLiteDatabase {
  constructor(filePath) {
    this.name = filePath;
    this.open = true;
    this.db = new DatabaseSync(filePath === ':memory:' ? ':memory:' : filePath);
    try {
      this.db.exec('PRAGMA foreign_keys = ON;');
      this.db.exec('PRAGMA journal_mode = WAL;');
    } catch (e) {
      // ignore
    }
  }

  exec(sql) {
    return this.db.exec(sql);
  }

  prepare(sql) {
    const stmt = this.db.prepare(sql);
    return {
      run: (...params) => {
        const res = stmt.run(...params);
        return {
          changes: res ? res.changes : 0,
          lastInsertRowid: res && res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : 0,
        };
      },
      get: (...params) => {
        const row = stmt.get(...params);
        return row ? { ...row } : undefined;
      },
      all: (...params) => {
        const rows = stmt.all(...params);
        return rows ? rows.map(r => ({ ...r })) : [];
      },
    };
  }

  close() {
    if (this.open) {
      this.db.close();
      this.open = false;
    }
  }
}

let activeDb = null;

function getDb(dbPath = null) {
  const targetPath = dbPath || process.env.DATABASE_PATH || DEFAULT_DB_PATH;

  if (activeDb && activeDb.name === targetPath && activeDb.open) {
    return activeDb;
  }

  if (targetPath !== ':memory:') {
    const dir = path.dirname(path.resolve(targetPath));
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  activeDb = new SQLiteDatabase(targetPath);
  return activeDb;
}

function initDb(dbInstance = null) {
  const db = dbInstance || getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      student_id TEXT UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'student',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      is_veg INTEGER NOT NULL DEFAULT 1,
      image_url TEXT,
      stock_quantity INTEGER NOT NULL DEFAULT 20,
      is_available INTEGER NOT NULL DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_number TEXT UNIQUE NOT NULL,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      status TEXT NOT NULL DEFAULT 'Placed',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      food_item_id INTEGER NOT NULL,
      item_name TEXT NOT NULL,
      price_at_order REAL NOT NULL,
      quantity INTEGER NOT NULL,
      subtotal REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders (id) ON DELETE CASCADE,
      FOREIGN KEY (food_item_id) REFERENCES food_items (id) ON DELETE RESTRICT
    );

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);
    CREATE INDEX IF NOT EXISTS idx_food_category ON food_items(category);
  `);

  return db;
}

function closeDb() {
  if (activeDb && activeDb.open) {
    activeDb.close();
    activeDb = null;
  }
}

module.exports = {
  SQLiteDatabase,
  getDb,
  initDb,
  closeDb,
  DEFAULT_DB_PATH,
};
