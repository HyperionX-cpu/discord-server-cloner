# 🚀 Discord Server Cloner

A powerful, full-stack Discord Server & Message replication platform built with **Node.js (Express & Discord.js v14)** and **React (Vite + Tailwind CSS)**.

![Discord Cloner](https://assets-global.website-files.com/6257adef93867e50d84d30e2/636e0a6a49cf127bf92de1e2_icon_clyde_blurple_RGB.png)

## ✨ Features

- **Full Server Synchronization**:
  - Server Name, Icon, Banner, and Verification Levels
  - Complete Role Hierarchy & granular permissions mapping
  - Categorized Channels (Text, Voice, Announcement, Stage) with synchronized permission overwrites
  - Custom Emojis and Stickers
  - Target Server Cleanup / Wipe options
- **Message History Cloning**:
  - Transfer chat history between channels
  - Replicate author names & avatars using automatic Relay Webhooks
  - Clone attachments, image files, and rich embeds
- **Live Interactive Terminal**:
  - Real-time Server-Sent Events (SSE) log streaming
  - Log filtering (All, Info, Step, Success, Warning, Error)
  - Auto-scroll, elapsed timer, and one-click log copying
- **Discord OAuth2 & Bot Integration**:
  - Identify & Guilds OAuth flow
  - Seamless permission validation & mutual guild discovery

---

## 🛠️ Project Structure

```
discord-cloner-app/
├── server/
│   ├── src/
│   │   ├── bot/
│   │   │   ├── client.js      # Discord.js Client initialization & intents
│   │   │   ├── cleaner.js     # Target server purge engine
│   │   │   └── cloner.js      # Core cloning & webhook impersonation engine
│   │   ├── routes/
│   │   │   ├── auth.js        # Discord OAuth2 routes
│   │   │   ├── guilds.js      # Guild discovery and metadata endpoints
│   │   │   └── clone.js       # Clone job manager & SSE log streamer
│   │   ├── utils/
│   │   │   └── logger.js      # In-memory and event-driven job logger
│   │   ├── config.js          # App configuration
│   │   └── index.js           # Express API server
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx    # Modern Discord navigation sidebar
│   │   │   ├── Navbar.jsx     # Topbar with bot latency & target server status
│   │   │   └── CloneLogs.jsx  # Real-time execution logs terminal
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Server overview & quick actions
│   │   │   ├── CloneServer.jsx# Complete server cloning view
│   │   │   ├── CloneMessages.jsx # Dedicated message cloning view
│   │   │   └── Guide.jsx      # Setup instructions
│   │   ├── context/
│   │   │   └── AuthContext.jsx# Discord user session & guild state
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── .env.example
└── README.md
```

---

## ⚡ Quick Start

### 1. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Fill in your Discord Bot and OAuth credentials:
```env
PORT=4000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=super_secret_discord_cloner_key

DISCORD_BOT_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
DISCORD_REDIRECT_URI=http://localhost:4000/api/auth/callback
```

### 2. Install Dependencies

**Backend:**
```bash
cd server
npm install
```

**Frontend:**
```bash
cd ../client
npm install
```

### 3. Run Development Servers

**Start the Backend (Port 4000):**
```bash
cd server
npm run dev
```

**Start the Frontend (Port 5173):**
```bash
cd client
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 🔒 Discord Bot Configuration Guide

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications).
2. Create an Application and add a Bot.
3. Under **Privileged Gateway Intents**, enable:
   - **Presence Intent**
   - **Server Members Intent**
   - **Message Content Intent**
4. Under **OAuth2 > General**, add `http://localhost:4000/api/auth/callback` to Redirects.
5. In your target Discord server, ensure the bot's role is positioned at the top of the role list under **Server Settings > Roles**.
