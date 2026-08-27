// Telegram bot for the dropshipping catalog
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const TelegramBot = require('node-telegram-bot-api');
const { statements } = require('../database');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN) {
    console.error('BOT_TOKEN is missing. Please set it in the .env file.');
    process.exit(1);
}

if (!WEBAPP_URL) {
    console.error('WEBAPP_URL is missing. Please set it in the .env file.');
    process.exit(1);
}

// Create the bot using polling
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

console.log('Telegram bot is running...');

// /start command - welcome message with WebApp button
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;

    bot.sendMessage(chatId, 'Welcome to our catalog! Tap the button below to browse products.', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: 'Open Catalog',
                        web_app: { url: WEBAPP_URL }
                    }
                ]
            ]
        }
    });
});

// Poll the database every few seconds to detect new orders and notify the admin.
// This is a simple MVP approach so the bot and server can stay separate processes
// while sharing the same SQLite database file.
let lastNotifiedOrderId = 0;

async function notifyAdminOfNewOrders() {
    try {
        // Get the most recent orders
        const orders = statements.getAllOrders.all();

        for (const order of orders) {
            if (order.id > lastNotifiedOrderId) {
                lastNotifiedOrderId = order.id;

                if (ADMIN_CHAT_ID) {
                    const message = `
🛒 <b>New Order #${order.id}</b>

📦 Product: ${order.product_name}
👤 Customer: ${order.customer_name}
📞 Phone: ${order.phone}
🏠 Address: ${order.address}
🕒 Date: ${order.created_at}
🚀 Status: ${order.status}
                    `.trim();

                    try {
                        await bot.sendMessage(ADMIN_CHAT_ID, message, { parse_mode: 'HTML' });
                    } catch (sendError) {
                        console.error('Failed to send admin notification:', sendError.message);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error polling orders for notifications:', error);
    }
}

// Initial poll to avoid notifying about old orders on restart
const initialOrders = statements.getAllOrders.all();
if (initialOrders.length > 0) {
    lastNotifiedOrderId = Math.max(...initialOrders.map(o => o.id));
}

// Check for new orders every 5 seconds
setInterval(notifyAdminOfNewOrders, 5000);
