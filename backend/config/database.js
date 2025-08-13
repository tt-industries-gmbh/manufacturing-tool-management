const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../database');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(dbDir, 'tools.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'operator',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tools (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    name_zh TEXT NOT NULL,
    category TEXT NOT NULL,
    category_zh TEXT NOT NULL,
    storage_location TEXT,
    storage_location_zh TEXT,
    status TEXT DEFAULT 'available',
    condition TEXT DEFAULT 'good',
    last_used DATETIME,
    last_maintenance DATETIME,
    next_maintenance DATETIME,
    maintenance_interval_days INTEGER DEFAULT 30,
    usage_count INTEGER DEFAULT 0,
    notes TEXT,
    notes_zh TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS maintenance_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL,
    maintenance_type TEXT NOT NULL,
    maintenance_type_zh TEXT NOT NULL,
    description TEXT,
    description_zh TEXT,
    performed_by TEXT,
    maintenance_date DATETIME NOT NULL,
    next_maintenance_date DATETIME,
    cost REAL DEFAULT 0,
    parts_replaced TEXT,
    parts_replaced_zh TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tool_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL,
    used_by TEXT NOT NULL,
    production_order TEXT,
    start_time DATETIME NOT NULL,
    end_time DATETIME,
    notes TEXT,
    notes_zh TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS tool_conditions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id INTEGER NOT NULL,
    condition_status TEXT NOT NULL,
    reported_by TEXT NOT NULL,
    description TEXT,
    description_zh TEXT,
    severity TEXT DEFAULT 'low',
    resolved BOOLEAN DEFAULT 0,
    resolved_date DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tool_id) REFERENCES tools (id) ON DELETE CASCADE
  )`);

  // Create default admin user with properly hashed password
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  
  db.run(`DELETE FROM users WHERE username = 'admin'`, () => {
    db.run(`INSERT INTO users (username, password, role) VALUES (?, ?, ?)`,
      ['admin', adminPassword, 'admin'],
      (err) => {
        if (err) {
          console.error('Error creating admin user:', err);
        } else {
          console.log('Default admin user created (username: admin, password: admin123)');
        }
      }
    );
  });
});

module.exports = db;