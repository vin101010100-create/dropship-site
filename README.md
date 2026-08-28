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

A single command starts both the Express server and the Telegram bot.

```bash
node server.js
```

The server will be available at `http://localhost:3000`.

If you want to run only the bot (for example, during local development):

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
3. Add the environment variables from your `.env` file in the Railway dashboard:
   - `BOT_TOKEN`
   - `ADMIN_CHAT_ID`
   - `WEBAPP_URL` (your Railway public URL, e.g. `https://your-app.railway.app`)
   - `ADMIN_PASSWORD`
4. Make sure the start command is `node server.js` (or `npm start`).
   This starts both the server and the Telegram bot in the same process.
5. Generate a public URL in the Railway dashboard and copy it into `WEBAPP_URL`.

> **Important:** Railway's filesystem is ephemeral. Without a persistent volume,
> the SQLite database (`dropship.db`) will be reset on every redeploy or restart.
> For production, either add a Railway volume and set `DB_PATH` to a folder inside it,
> or switch to a managed database like PostgreSQL.

## Notes

- The SQLite database file `dropship.db` is created automatically on first run.
- The bot and server share the same database file and can run in a single process.
- The frontend works both inside Telegram WebApp and in a regular browser.
