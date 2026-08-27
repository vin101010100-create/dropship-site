// Database setup using better-sqlite3
// The database file is created automatically on first run.

const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dropship.db');

// Open (or create) the SQLite database file
const db = new Database(DB_PATH);

// Enable foreign key constraints and WAL mode for safer concurrent access
// between the Express server and the Telegram bot processes.
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run the schema file to create tables and seed sample products
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Prepared statements for common operations
const statements = {
    // Products
    getAllProducts: db.prepare('SELECT * FROM products'),
    getProductById: db.prepare('SELECT * FROM products WHERE id = ?'),

    // Orders
    getAllOrders: db.prepare('SELECT * FROM orders ORDER BY created_at DESC'),
    getOrderById: db.prepare('SELECT * FROM orders WHERE id = ?'),
    createOrder: db.prepare(`
        INSERT INTO orders (user_id, user_name, product_id, product_name, customer_name, phone, address)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `),
    updateOrderStatus: db.prepare('UPDATE orders SET status = ? WHERE id = ?')
};

module.exports = {
    db,
    statements
};
