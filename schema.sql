-- SQLite schema for the dropshipping catalog MVP

-- Products table: stores catalog items
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    image_url TEXT,
    category TEXT,
    in_stock INTEGER DEFAULT 1
);

-- Orders table: stores customer orders
CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_name TEXT,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Pre-populate with 5 sample products
INSERT OR IGNORE INTO products (id, name, description, price, image_url, category, in_stock) VALUES
(1, 'Wireless Earbuds', 'Compact Bluetooth earbuds with 20-hour battery and noise isolation.', 29.99, 'https://via.placeholder.com/300x200?text=Wireless+Earbuds', 'Electronics', 1),
(2, 'Minimalist Backpack', 'Water-resistant daypack with laptop compartment and hidden pockets.', 39.99, 'https://via.placeholder.com/300x200?text=Backpack', 'Accessories', 1),
(3, 'Stainless Steel Bottle', 'Insulated 500ml bottle keeps drinks cold for 24 hours.', 19.99, 'https://via.placeholder.com/300x200?text=Water+Bottle', 'Home', 1),
(4, 'Phone Stand', 'Adjustable aluminum phone and tablet stand for desk or bed.', 14.99, 'https://via.placeholder.com/300x200?text=Phone+Stand', 'Electronics', 1),
(5, 'LED Desk Lamp', 'Dimmable LED lamp with USB charging port and touch controls.', 24.99, 'https://via.placeholder.com/300x200?text=Desk+Lamp', 'Home', 1);
