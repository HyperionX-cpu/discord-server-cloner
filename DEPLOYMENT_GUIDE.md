# 🚀 Discord Cloner App - 24/7 Cloud Deployment Guide

This guide walks you through deploying the **Discord Server & Channel Cloner** (React Vite frontend + Express backend + Discord.js bot) to the cloud for free or low cost with 24/7 uptime.

---

## 📑 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Prerequisites: Discord Developer Portal Setup](#-prerequisites-discord-developer-portal-setup)
3. [Option A: Render.com (Recommended Free/Easy Hosting)](#-option-a-rendercom-free--easy)
4. [Option B: Railway.app (Easiest 24/7 Hosting)](#-option-b-railwayapp-easiest-247-bot-hosting)
5. [Option C: Fly.io / Koyeb](#-option-c-flyio--koyeb)
6. [Option D: Cloud VPS (Hetzner / DigitalOcean / Linode / Oracle Free Tier)](#-option-d-cloud-vps-with-docker--docker-compose)
7. [Configuring Discord OAuth2 Redirect URIs](#-configuring-discord-oauth2-redirect-uris)
8. [Environment Variable Reference](#-environment-variable-reference)
9. [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 🏗 Architecture Overview

The app is packaged into a unified, lightweight Docker container:
- **Client (Frontend)**: React 18 + Vite + Tailwind CSS (compiled into static assets at `client/dist`).
- **Server (Backend)**: Node.js + Express + Discord.js gateway client + WebSocket log streamer.
- **Port**: Default `4000` (serves both API routes `/api/*` and the static React Single Page Application).

```
+-------------------------------------------------------------+
|                     Docker Container                        |
|                                                             |
|   +-----------------------------------------------------+   |
|   |         Express Server (Port 4000)                  |   |
|   |                                                     |   |
|   |  • GET /                -> React UI (Vite Bundle)   |   |
|   |  • /api/auth/*          -> Discord OAuth2 Login     |   |
|   |  • /api/guilds/*        -> Guild Fetch & Inspect    |   |
|   |  • /api/clone/*         -> Clone Engine + SSE Logs  |   |
|   |  • /api/health          -> Uptime Monitoring        |   |
|   |                                                     |   |
|   |  • Discord.js Bot Client (24/7 Gateway Connection)  |   |
|   +-----------------------------------------------------+   |
+-------------------------------------------------------------+
```

---

## 🔑 Prerequisites: Discord Developer Portal Setup

Before deploying to any cloud host, obtain your Discord Bot and OAuth2 credentials:

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. Click **New Application**, enter a name (e.g. `Server Cloner`), and create it.
3. **Get Client Credentials**:
   - Go to **OAuth2 -> General**.
   - Copy **Client ID**.
   - Click **Reset Secret** and copy the **Client Secret**.
4. **Get Bot Token & Enable Intents**:
   - Go to **Bot** tab.
   - Click **Reset Token** and copy the **Bot Token**.
   - Scroll down to **Privileged Gateway Intents** and enable:
     - ✅ **Server Members Intent**
     - ✅ **Message Content Intent**
   - Click **Save Changes**.

---

## 🌟 Option A: Render.com (Free / Easy)

Render offers free web service hosting with automatic HTTPS and continuous deployment from GitHub.

### Step 1: Push your project to GitHub
```bash
git init
git add .
git commit -m "Initial commit with deployment config"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/discord-cloner-app.git
git push -u origin main
```

### Step 2: Deploy using Render Blueprint (1-Click)
1. Sign in to [Render.com](https://render.com).
2. Click **New +** -> **Blueprint**.
3. Connect your GitHub repository. Render will automatically detect `render.yaml`.
4. Fill in the required environment variables:
   - `DISCORD_BOT_TOKEN`: Your bot token.
   - `DISCORD_CLIENT_ID`: Your application client ID.
   - `DISCORD_CLIENT_SECRET`: Your application client secret.
5. Click **Apply**. Render will build the Docker container and assign a URL (e.g., `https://discord-cloner-app-xxxx.onrender.com`).

### Step 3: Update Redirect URI & Domain in Render
Once deployed:
1. Copy your live Render URL (e.g. `https://discord-cloner-app-xxxx.onrender.com`).
2. Go to **Environment** in your Render service settings and set:
   - `FRONTEND_URL` = `https://discord-cloner-app-xxxx.onrender.com`
   - `DISCORD_REDIRECT_URI` = `https://discord-cloner-app-xxxx.onrender.com/api/auth/callback`
3. Save changes (Render will automatically re-deploy).
4. Update the Discord Developer Portal redirect URL (see [Section 7](#-configuring-discord-oauth2-redirect-uris)).

> **💡 Keeping the Free Instance Awake (24/7)**:
> Render's free tier spins down after 15 minutes of inactivity. To keep your Discord Bot and dashboard online 24/7 for free:
> - Create a free account on [UptimeRobot](https://uptimerobot.com) or [Cron-Job.org](https://cron-job.org).
> - Add an **HTTP(s) Monitor** pointing to `https://your-app.onrender.com/api/health` checking every **5 to 10 minutes**.

---

## 🚂 Option B: Railway.app (Easiest 24/7 Bot Hosting)

Railway provides uninterrupted 24/7 background worker & web application hosting with a generous free trial / low $5 hobby plan.

### Step 1: Create Project on Railway
1. Sign in to [Railway.app](https://railway.app).
2. Click **+ New Project** -> **Deploy from GitHub repo**.
3. Select your `discord-cloner-app` repository.

### Step 2: Configure Environment Variables
In the Railway project dashboard, navigate to **Variables** and add:
- `PORT` = `4000`
- `SESSION_SECRET` = `<generate-a-random-32-char-string>`
- `DISCORD_BOT_TOKEN` = `your_bot_token_here`
- `DISCORD_CLIENT_ID` = `your_client_id_here`
- `DISCORD_CLIENT_SECRET` = `your_client_secret_here`

### Step 3: Generate Public Domain
1. In Railway, go to **Settings** -> **Networking** -> **Generate Domain**.
2. Railway gives you a domain like `discord-cloner-app-production.up.railway.app`.
3. Add the two final variables:
   - `FRONTEND_URL` = `https://discord-cloner-app-production.up.railway.app`
   - `DISCORD_REDIRECT_URI` = `https://discord-cloner-app-production.up.railway.app/api/auth/callback`
4. Add the redirect URI in the Discord Developer Portal.

---

## 🎈 Option C: Fly.io / Koyeb

### Deploying to Fly.io
1. Install flyctl: `npm install -g flyctl` or via [Fly.io Installation Guide](https://fly.io/docs/hands-on/install-flyctl/).
2. Login:
   ```bash
   fly auth login
   ```
3. Initialize the app (using the provided `fly.toml`):
   ```bash
   fly launch --no-deploy
   ```
4. Set your production secrets securely:
   ```bash
   fly secrets set \
     DISCORD_BOT_TOKEN="your_bot_token" \
     DISCORD_CLIENT_ID="your_client_id" \
     DISCORD_CLIENT_SECRET="your_client_secret" \
     SESSION_SECRET="your_secure_session_secret_32_characters" \
     FRONTEND_URL="https://your-app-name.fly.dev" \
     DISCORD_REDIRECT_URI="https://your-app-name.fly.dev/api/auth/callback"
   ```
5. Deploy:
   ```bash
   fly deploy
   ```

### Deploying to Koyeb
1. Register at [Koyeb.com](https://www.koyeb.com).
2. Click **Create App** -> **GitHub**.
3. Select **Dockerfile** builder option.
4. Set Port to `4000` and configure environment variables.

---

## 🖥 Option D: Cloud VPS with Docker & Docker Compose
*(Hetzner, DigitalOcean, Linode, AWS EC2, or Oracle Cloud Free Tier)*

If you have a Linux server (Ubuntu/Debian) with Docker installed:

### Step 1: Clone Repository onto Server
```bash
git clone https://github.com/YOUR_USERNAME/discord-cloner-app.git /opt/discord-cloner-app
cd /opt/discord-cloner-app
```

### Step 2: Configure `.env`
Create production `.env` file:
```bash
cp .env.example .env
nano .env
```
Fill in your credentials:
```env
PORT=4000
FRONTEND_URL=https://cloner.yourdomain.com
SESSION_SECRET=a_very_long_secure_random_string_here_32_chars
DISCORD_BOT_TOKEN=MTA...your_real_bot_token
DISCORD_CLIENT_ID=123456789012345678
DISCORD_CLIENT_SECRET=abcdef123456...
DISCORD_REDIRECT_URI=https://cloner.yourdomain.com/api/auth/callback
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d --build
```

### Step 4: Set Up Caddy or Nginx for Free SSL (HTTPS)

#### Option 1: Caddy (Simplest with automatic SSL)
Install Caddy and add to `/etc/caddy/Caddyfile`:
```caddy
cloner.yourdomain.com {
    reverse_proxy localhost:4000
}
```
Reload Caddy:
```bash
sudo systemctl reload caddy
```

#### Option 2: Nginx + Certbot
```nginx
server {
    server_name cloner.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Obtain SSL certificate:
```bash
sudo certbot --nginx -d cloner.yourdomain.com
```

---

## 🔗 Configuring Discord OAuth2 Redirect URIs

Discord strictly validates OAuth2 redirect URIs. If they do not match, you will see `Invalid OAuth2 redirect_uri`.

1. Go to [Discord Developer Portal -> Applications](https://discord.com/developers/applications).
2. Click your application and open **OAuth2 -> General**.
3. Under **Redirects**, click **Add Redirect**.
4. Add your cloud URL with `/api/auth/callback` path:
   - For Render: `https://<your-render-subdomain>.onrender.com/api/auth/callback`
   - For Railway: `https://<your-railway-domain>.up.railway.app/api/auth/callback`
   - For Fly.io: `https://<your-app>.fly.dev/api/auth/callback`
   - For Custom VPS / Domain: `https://cloner.yourdomain.com/api/auth/callback`
   - For Local Dev: `http://localhost:4000/api/auth/callback`
5. Click **Save Changes**.

---

## 📋 Environment Variable Reference

| Variable | Description | Example / Default | Required |
|---|---|---|:---:|
| `PORT` | Web server port | `4000` | No (default `4000`) |
| `FRONTEND_URL` | Public base URL of the application | `https://my-app.onrender.com` | **Yes** |
| `SESSION_SECRET` | Secret string for encrypted session cookies | `32+ characters random string` | **Yes** |
| `DISCORD_BOT_TOKEN` | Discord Bot Token | `MTA...` | **Yes** |
| `DISCORD_CLIENT_ID` | Discord Application Client ID | `123456789012345678` | **Yes** |
| `DISCORD_CLIENT_SECRET` | Discord Application Client Secret | `abcde...` | **Yes** |
| `DISCORD_REDIRECT_URI` | Exact OAuth2 redirect callback endpoint | `https://my-app.onrender.com/api/auth/callback` | **Yes** |

---

## ❓ Troubleshooting & FAQ

### 1. `Invalid OAuth2 redirect_uri` Error
- **Cause**: The `DISCORD_REDIRECT_URI` environment variable does not match what you entered in the Discord Developer Portal under **OAuth2 -> Redirects**.
- **Fix**: Verify both match character-for-character, including `https://` and `/api/auth/callback`.

### 2. Bot connects locally but not in cloud
- **Cause**: Missing Discord Privileged Gateway Intents.
- **Fix**: In Discord Developer Portal -> **Bot**, ensure **Server Members Intent** and **Message Content Intent** are toggled ON.

### 3. Session login logs out immediately on refresh
- **Cause**: Reverse proxy cookie handling.
- **Fix**: The server has `app.set('trust proxy', 1)` enabled by default. Ensure your cloud deployment is accessed over `https://`.

### 4. How do I invite the bot to my servers?
- The dashboard automatically generates an invite link under the **"Invite Bot"** button in the header, or you can construct:
  ```
  https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=8&scope=bot+applications.commands
  ```
- Make sure the bot is invited to both the **Source Server** (to read structure) and the **Target Server** (with Administrator permissions to create channels/roles).

---

🎉 **You are now ready to clone Discord servers 24/7 from the cloud!**
