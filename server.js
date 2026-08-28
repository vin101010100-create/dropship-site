// Main Express server for the dropshipping catalog
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { statements } = require('./database');
const { startBot, stopBot } = require('./bot/bot');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS so the frontend (and Telegram WebApp) can call the API
app.use(cors());

// Parse JSON request bodies
app.use(bodyParser.json());

// Serve static frontend files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint for monitoring
app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

// GET /api/products - return all products as JSON
app.get('/api/products', async (req, res) => {
    try {
        const products = await statements.getAllProducts();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET /api/products/:id - return a single product by ID
app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await statements.getProductById(req.params.id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST /api/orders - create a new order
app.post('/api/orders', async (req, res) => {
    try {
        const { product_id, customer_name, phone, address } = req.body;

        // Basic validation
        if (!product_id || !customer_name || !phone || !address) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Look up the product to include its name in the order
        const product = await statements.getProductById(product_id);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Extract Telegram user info from the WebApp init data header if present
        const initDataHeader = req.headers['x-telegram-init-data'] || '';
        let userId = null;
        let userName = null;

        if (initDataHeader) {
            try {
                const params = new URLSearchParams(initDataHeader);
                const userJson = params.get('user');
                if (userJson) {
                    const user = JSON.parse(userJson);
                    userId = String(user.id);
                    userName = user.username || `${user.first_name || ''} ${user.last_name || ''}`.trim();
                }
            } catch (parseError) {
                console.warn('Could not parse Telegram init data:', parseError.message);
            }
        }

        // Insert the order into the database
        const result = await statements.createOrder(
            userId,
            userName,
            product_id,
            product.name,
            customer_name,
            phone,
            address
        );

        res.status(201).json({
            id: result.lastID,
            product_id,
            product_name: product.name,
            customer_name,
            phone,
            address,
            status: 'pending'
        });
    } catch (error) {
        console.error('Error creating order:', error);
        res.status(500).json({ error: 'Failed to create order' });
    }
});

// GET /api/orders - return all orders (for the admin panel)
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await statements.getAllOrders();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// PUT /api/orders/:id/status - update order status
app.put('/api/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['pending', 'processing', 'shipped', 'cancelled'];

        if (!status || !allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const result = await statements.updateOrderStatus(status, req.params.id);
        if (result.changes === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.json({ id: req.params.id, status });
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// Start the server
const server = app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

// Start the Telegram bot in the same process.
// This keeps the deployment simple: one command starts both the API and the bot.
const bot = startBot();

// Graceful shutdown so the bot stops polling when Railway restarts the service
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully...');
    stopBot(bot);
    server.close(() => {
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully...');
    stopBot(bot);
    server.close(() => {
        process.exit(0);
    });
});
