// Telegram bot for the dropshipping catalog
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const TelegramBot = require('node-telegram-bot-api');
const { statements } = require('../database');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBAPP_URL = process.env.WEBAPP_URL;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

let intervalId = null;

function startBot() {
    if (!BOT_TOKEN) {
        console.warn('BOT_TOKEN is not set. Telegram bot will not be started.');
        return null;
    }

    if (!WEBAPP_URL) {
        console.warn('WEBAPP_URL is not set. Telegram bot will not be started.');
        return null;
    }

    let bot;
    try {
        bot = new TelegramBot(BOT_TOKEN, { polling: true });
    } catch (error) {
        console.error('Failed to create Telegram bot:', error.message);
        return null;
    }

    console.log('Telegram bot is running...');

    bot.on('polling_error', (error) => {
        console.error('Telegram bot polling error:', error.message);
    });

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
            const orders = await statements.getAllOrders();

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
    (async function initializeLastNotifiedOrderId() {
        try {
            const initialOrders = await statements.getAllOrders();
            if (initialOrders.length > 0) {
                lastNotifiedOrderId = Math.max(...initialOrders.map(o => o.id));
            }
        } catch (error) {
            console.error('Error initializing last notified order id:', error);
        }
    })();

    // Check for new orders every 5 seconds
    intervalId = setInterval(notifyAdminOfNewOrders, 5000);

    return bot;
}

function stopBot(bot) {
    if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
    }
    if (bot) {
        bot.stopPolling();
    }
}

// If this file is run directly, start the bot standalone
if (require.main === module) {
    startBot();
}

module.exports = { startBot, stopBot };
