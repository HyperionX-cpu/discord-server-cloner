import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root or server dir
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const config = {
  port: process.env.PORT || 4000,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  sessionSecret: process.env.SESSION_SECRET || 'discord-cloner-secret-key-1234567890',
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN || '',
    clientId: process.env.DISCORD_CLIENT_ID || '',
    clientSecret: process.env.DISCORD_CLIENT_SECRET || '',
    redirectUri: process.env.DISCORD_REDIRECT_URI || process.env.REDIRECT_URI || 'http://localhost:4000/api/auth/callback',
    oauthUrl: process.env.DISCORD_CLIENT_ID
      ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(
          process.env.DISCORD_REDIRECT_URI || process.env.REDIRECT_URI || 'http://localhost:4000/api/auth/callback'
        )}&scope=identify+guilds`
      : '',
    botInviteUrl: process.env.DISCORD_CLIENT_ID
      ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&permissions=8&scope=bot+applications.commands`
      : '',
  },
};
