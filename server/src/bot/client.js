import { Client, GatewayIntentBits, Partials } from 'discord.js';
import { config } from '../config.js';

let client = null;
let isReady = false;

export async function initBot() {
  if (!config.discord.botToken) {
    console.warn('[BOT] DISCORD_BOT_TOKEN is not set in environment. Bot is running in offline/demo mode.');
    return null;
  }

  try {
    client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
      ],
      partials: [
        Partials.Channel,
        Partials.Message,
        Partials.User,
        Partials.GuildMember,
        Partials.Reaction,
      ],
    });

    client.once('ready', () => {
      isReady = true;
      console.log(`[BOT] Logged in as ${client.user.tag} (ID: ${client.user.id})`);
      console.log(`[BOT] Present in ${client.guilds.cache.size} guilds.`);
    });

    client.on('error', (err) => {
      console.error('[BOT ERROR]', err);
    });

    await client.login(config.discord.botToken);
    return client;
  } catch (err) {
    console.error('[BOT INIT FAILED]', err.message);
    return null;
  }
}

export function getClient() {
  return client;
}

export function isBotReady() {
  return isReady && client?.isReady();
}

export function getGuild(guildId) {
  if (!client || !isReady) return null;
  return client.guilds.cache.get(guildId) || null;
}
