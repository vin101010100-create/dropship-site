// Database setup using sqlite3 (async API).
// The database file is created automatically on first run.

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'dropship.db');

// Open (or create) the SQLite database file
const db = new sqlite3.Database(DB_PATH);

// Promise wrappers around sqlite3's callback API.
function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) return reject(err);
            resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
}

function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
        });
    });
}

function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) return reject(err);
            resolve(row);
        });
    });
}

// Enable foreign key constraints and WAL mode for safer concurrent access
// between the Express server and the Telegram bot processes.
// db.exec queues these statements; subsequent queries run after them.
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Run the schema file to create tables and seed sample products
const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf-8');
db.exec(schema);

// Prepared-statement-like helpers for common operations
const statements = {
    // Products
    getAllProducts: () => all('SELECT * FROM products'),
    getProductById: (id) => get('SELECT * FROM products WHERE id = ?', [id]),

    // Orders
    getAllOrders: () => all('SELECT * FROM orders ORDER BY created_at DESC'),
    getOrderById: (id) => get('SELECT * FROM orders WHERE id = ?', [id]),
    createOrder: (userId, userName, productId, productName, customerName, phone, address) =>
        run(`
            INSERT INTO orders (user_id, user_name, product_id, product_name, customer_name, phone, address)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [userId, userName, productId, productName, customerName, phone, address]),
    updateOrderStatus: (status, id) => run('UPDATE orders SET status = ? WHERE id = ?', [status, id])
};

module.exports = {
    db,
    statements
};
