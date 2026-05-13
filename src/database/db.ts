import * as SQLite from 'expo-sqlite';

// Initialize the database
let dbInstance: SQLite.SQLiteDatabase | null = null;

export const getDB = async () => {
  if (dbInstance) return dbInstance;
  dbInstance = await SQLite.openDatabaseAsync('kasir_kilatz.db');
  return dbInstance;
};

export const initDatabase = async () => {
  try {
    const db = await getDB();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('CASHIER', 'SUPERVISOR', 'OWNER')),
        pin TEXT
      );

      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        sku TEXT,
        price REAL NOT NULL,
        stock INTEGER DEFAULT 0,
        category TEXT,
        image_uri TEXT,
        is_active INTEGER DEFAULT 1
      );

      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_number TEXT UNIQUE NOT NULL,
        total_amount REAL NOT NULL,
        payment_method TEXT,
        cashier_id INTEGER,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        status TEXT DEFAULT 'COMPLETED'
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        unit_price REAL NOT NULL,
        subtotal REAL NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders (id),
        FOREIGN KEY (product_id) REFERENCES products (id)
      );

      CREATE TABLE IF NOT EXISTS rooms (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'REGULAR',
        hourly_rate REAL NOT NULL,
        status TEXT DEFAULT 'AVAILABLE'
      );

      CREATE TABLE IF NOT EXISTS room_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room_id INTEGER,
        start_time TEXT NOT NULL,
        end_time TEXT,
        total_cost REAL,
        status TEXT DEFAULT 'ACTIVE',
        FOREIGN KEY (room_id) REFERENCES rooms (id)
      );

      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'FOOD',
        icon TEXT
      );
    `);

    // Seed initial user if not exists
    const result = await db.getAllAsync('SELECT * FROM users LIMIT 1');
    if (result.length === 0) {
      await db.runAsync(
        'INSERT INTO users (name, username, password_hash, role, pin) VALUES (?, ?, ?, ?, ?)',
        ['Admin', 'admin', 'admin123', 'OWNER', '1234']
      );
      console.log('Seeded initial admin user');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};
