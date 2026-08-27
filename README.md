# Dropshipping Catalog + Telegram Bot

A simple MVP dropshipping catalog website with Telegram bot integration.

## Features

- Product catalog with cart functionality
- Order form (name, phone, address)
- Admin panel to manage order statuses
- Telegram bot with WebApp button
- Admin notifications for new orders
- SQLite database shared between server and bot

## Tech Stack

- Backend: Node.js + Express
- Database: SQLite (`sqlite3`)
- Frontend: Plain HTML, CSS, JavaScript
- Telegram Bot: `node-telegram-bot-api`

## Project Structure

```
.
├── server.js           # Express API and static file server
├── database.js         # SQLite setup and prepared statements
├── schema.sql          # Database schema + sample products
├── package.json        # Server dependencies
├── .env.example        # Environment variable template
├── public/             # Frontend files
│   ├── index.html      # Catalog page
│   ├── cart.html       # Cart + checkout page
│   ├── admin.html      # Admin panel
│   ├── styles.css      # Telegram-like styling
│   └── app.js          # Shared frontend logic
├── bot/
│   ├── bot.js          # Telegram bot
│   └── package.json    # Bot dependencies
└── README.md
```

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

## Installation

1. Clone or download this repository.

2. Install server dependencies:

```bash
npm install
```

3. Install bot dependencies:

```bash
cd bot
npm install
cd ..
```

4. Create the `.env` file from the example:

```bash
cp .env.example .env
```

5. Fill in the `.env` values:

```env
BOT_TOKEN=your_telegram_bot_token_here
ADMIN_CHAT_ID=your_telegram_user_id
WEBAPP_URL=https://your-app.railway.app
PORT=3000
ADMIN_PASSWORD=admin123
```

### How to get a Telegram Bot Token

1. Open Telegram and message [@BotFather](https://t.me/BotFather).
2. Send `/newbot` and follow the instructions.
3. Copy the bot token you receive into `.env` as `BOT_TOKEN`.

### How to get your Telegram User ID

1. Message [@userinfobot](https://t.me/userinfobot) on Telegram.
2. It will reply with your user ID.
3. Copy it into `.env` as `ADMIN_CHAT_ID`.

### How to set the WebApp URL

If running locally for testing, use:

```env
WEBAPP_URL=http://localhost:3000
```

For production, use your deployed domain:

```env
WEBAPP_URL=https://your-app.railway.app
```

> Note: Telegram WebApp requires HTTPS in production. Localhost works fine for testing with the bot.

## Running the Project

You need to run two separate processes.

### 1. Start the server

```bash
node server.js
```

The server will be available at `http://localhost:3000`.

### 2. Start the bot

In a new terminal:

```bash
node bot/bot.js
```

## Using the Admin Panel

Open `http://localhost:3000/admin.html` in your browser.

- Password: `admin123` (set in `.env` as `ADMIN_PASSWORD`)
- View all orders and update statuses: Pending / Processing / Shipped / Cancelled.

## Deploying to Railway

1. Push the project to a GitHub repository.
2. Go to [Railway](https://railway.app/) and create a new project from GitHub.
3. Add the environment variables from your `.env` file in the Railway dashboard.
4. Set the start command to `node server.js`.
5. Railway will provide a public URL - put that URL in `WEBAPP_URL`.
6. Run the bot as a separate service or process with `node bot/bot.js`, using the same environment variables.

## Notes

- The SQLite database file `dropship.db` is created automatically on first run.
- The bot and server share the same database file, so they can run as separate processes.
- The frontend works both inside Telegram WebApp and in a regular browser.
