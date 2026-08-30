import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { EmbedBuilder } from 'discord.js';
import { config } from '../config.js';
import { getClient } from '../bot/client.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../keys_data.json');

const OWNER_DISCORD_ID = "1240169071287205950";

let memoryCache = { keys: {}, users: {}, bannedUsers: {} };
let syncedMessageId = null;

// Build a clean embed displaying all active keys and statistics
function buildKeysEmbed(data) {
  const allKeys = Object.values(data.keys || {});
  const claimedCount = allKeys.filter(k => k.claimedBy).length;
  const availableCount = allKeys.length - claimedCount;

  const embed = new EmbedBuilder()
    .setTitle('⚡ VEIL CLONER — LIVE LICENSE DATABASE')
    .setColor(0x000000)
    .setDescription(
      `**Total Keys:** \`${allKeys.length}\` | **Available:** \`${availableCount}\` | **Claimed:** \`${claimedCount}\`\n` +
      `*This embed automatically updates every time a key is generated, claimed, or deleted.*`
    )
    .setTimestamp();

  if (allKeys.length === 0) {
    embed.addFields({ name: 'Active Keys', value: '`No keys generated yet.`' });
  } else {
    // Group keys preview (showing up to 25 latest)
    const list = allKeys.slice(-25).reverse().map(k => {
      const status = k.claimedBy ? `🔒 Claimed by <@${k.claimedBy}>` : '🟢 Unclaimed';
      const dur = k.duration === 'lifetime' ? 'Lifetime' : k.duration;
      return `• \`${k.key}\` — **${dur}** (${status})`;
    }).join('\n');

    embed.addFields({ name: 'Keys Registry', value: list.slice(0, 1024) || '`Empty`' });
  }

  return embed;
}

// Push latest database embed + hidden JSON payload directly into Discord Channel
async function syncToDiscordEmbed(data) {
  try {
    const client = getClient();
    if (!client || !client.isReady() || !config.discordKeyChannelId) {
      console.log('[DISCORD SYNC] Bot not ready or channel ID missing.');
      return;
    }

    const channel = await client.channels.fetch(config.discordKeyChannelId).catch((err) => {
      console.error('[DISCORD SYNC ERROR] Could not fetch channel:', err.message);
      return null;
    });

    if (!channel || !channel.isTextBased()) {
      console.warn(`[DISCORD SYNC] Channel ${config.discordKeyChannelId} not found or is not a text channel.`);
      return;
    }

    const jsonStr = JSON.stringify(data);
    const embed = buildKeysEmbed(data);

    // If we have a cached synced message, attempt to edit it
    if (syncedMessageId) {
      try {
        const msg = await channel.messages.fetch(syncedMessageId);
        if (msg) {
          await msg.edit({
            content: `||DATABASE_STORE:${jsonStr}:DATABASE_END||`,
            embeds: [embed]
          });
          console.log(`✅ [DISCORD BOT DB] Edited existing embed message (${syncedMessageId}).`);
          return;
        }
      } catch (_) {
        syncedMessageId = null;
      }
    }

    // Search recent messages in the channel for previous database message
    const messages = await channel.messages.fetch({ limit: 25 }).catch(() => null);
    if (messages) {
      const existing = messages.find(m => m.author.id === client.user.id && m.content.includes('DATABASE_STORE:'));
      if (existing) {
        syncedMessageId = existing.id;
        await existing.edit({
          content: `||DATABASE_STORE:${jsonStr}:DATABASE_END||`,
          embeds: [embed]
        });
        console.log(`✅ [DISCORD BOT DB] Found & updated existing embed in channel (${syncedMessageId}).`);
        return;
      }
    }

    // Send new master embed message
    const newMsg = await channel.send({
      content: `||DATABASE_STORE:${jsonStr}:DATABASE_END||`,
      embeds: [embed]
    });
    syncedMessageId = newMsg.id;
    console.log(`✅ [DISCORD BOT DB] Created new live keys embed message in channel (${syncedMessageId})!`);
  } catch (err) {
    console.error('❌ [DISCORD BOT DB SYNC ERROR]', err.message);
  }
}

// Pull database from Discord channel message on boot
export async function pullFromDiscordChannel() {
  try {
    const client = getClient();
    if (!client || !client.isReady() || !config.discordKeyChannelId) return;

    const channel = await client.channels.fetch(config.discordKeyChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return;

    const messages = await channel.messages.fetch({ limit: 25 }).catch(() => null);
    if (!messages) return;

    const targetMsg = messages.find(m => m.author.id === client.user.id && m.content.includes('DATABASE_STORE:'));
    if (targetMsg) {
      syncedMessageId = targetMsg.id;
      const match = targetMsg.content.match(/DATABASE_STORE:(.+):DATABASE_END/);
      if (match && match[1]) {
        const parsed = JSON.parse(match[1]);
        if (parsed && typeof parsed === 'object') {
          memoryCache = parsed;
          fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
          console.log(`✅ [DISCORD BOT DB] Restored ${Object.keys(parsed.keys || {}).length} keys directly from Discord Channel Embed on startup!`);
        }
      }
    }
  } catch (err) {
    console.error('❌ [DISCORD BOT PULL ERROR]', err.message);
  }
}

function loadData() {
  if (memoryCache && (Object.keys(memoryCache.keys).length > 0 || Object.keys(memoryCache.users).length > 0)) {
    return memoryCache;
  }
  if (fs.existsSync(DATA_FILE)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
      memoryCache = parsed;
      return memoryCache;
    } catch (_) {}
  }
  return memoryCache;
}

async function saveData(data) {
  memoryCache = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[LOCAL SAVE ERROR]', err);
  }

  // Update Discord live embed in channel
  await syncToDiscordEmbed(data);
}

export function generateKeyString(prefix = 'VEIL') {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const segment = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${prefix}-${segment()}-${segment()}-${segment()}`;
}

export const keyService = {
  isAdmin(discordId) {
    if (!discordId) return false;
    return discordId.toString() === OWNER_DISCORD_ID;
  },

  isUserBanned(discordId) {
    if (!discordId) return false;
    const data = loadData();
    return !!data.bannedUsers?.[discordId.toString()];
  },

  async banUser(discordId, reason = 'Violating terms', bannedBy = 'Admin') {
    const data = loadData();
    if (!data.bannedUsers) data.bannedUsers = {};
    data.bannedUsers[discordId.toString()] = {
      discordId: discordId.toString(),
      reason,
      bannedBy,
      bannedAt: new Date().toISOString()
    };
    if (data.users?.[discordId.toString()]) {
      delete data.users[discordId.toString()];
    }
    await saveData(data);
    return true;
  },

  async unbanUser(discordId) {
    const data = loadData();
    if (data.bannedUsers?.[discordId.toString()]) {
      delete data.bannedUsers[discordId.toString()];
      await saveData(data);
      return true;
    }
    return false;
  },

  getBannedUsers() {
    const data = loadData();
    return Object.values(data.bannedUsers || {});
  },

  async createKey({ duration = '30d', note = '', prefix = 'VEIL' }) {
    const data = loadData();
    if (!data.keys) data.keys = {};
    const key = generateKeyString(prefix);
    data.keys[key] = {
      key,
      duration,
      createdAt: new Date().toISOString(),
      claimedBy: null,
      claimedUsername: null,
      claimedAt: null,
      expiresAt: null,
      note
    };
    await saveData(data);
    return data.keys[key];
  },

  async deleteKey(key) {
    const data = loadData();
    if (data.keys?.[key]) {
      const keyObj = data.keys[key];
      if (keyObj.claimedBy && data.users?.[keyObj.claimedBy]) {
        delete data.users[keyObj.claimedBy];
      }
      delete data.keys[key];
      await saveData(data);
      return true;
    }
    return false;
  },

  getAllKeys() {
    const data = loadData();
    return Object.values(data.keys || {});
  },

  getFullData() {
    return loadData();
  },

  async importFullData(newData) {
    if (newData && typeof newData === 'object') {
      await saveData(newData);
      return true;
    }
    return false;
  },

  getUserLicense(discordId) {
    if (!discordId) return null;
    const data = loadData();
    
    if (data.bannedUsers?.[discordId.toString()]) {
      return { active: false, banned: true, reason: data.bannedUsers[discordId.toString()].reason };
    }

    if (this.isAdmin(discordId)) {
      return {
        active: true,
        isOwner: true,
        duration: 'lifetime',
        expiresAt: null,
        key: 'OWNER-BYPASS'
      };
    }

    const userEntry = data.users?.[discordId.toString()];
    if (!userEntry) {
      return { active: false, needsKey: true };
    }

    if (userEntry.duration === 'lifetime') {
      return { active: true, duration: 'lifetime', expiresAt: null, key: userEntry.key };
    }

    const now = new Date();
    const expiry = new Date(userEntry.expiresAt);
    if (now > expiry) {
      return { active: false, expired: true, expiresAt: userEntry.expiresAt, key: userEntry.key };
    }

    return {
      active: true,
      duration: userEntry.duration,
      expiresAt: userEntry.expiresAt,
      key: userEntry.key
    };
  },

  async redeemKey(discordId, username, keyInput) {
    const data = loadData();
    const cleanKey = keyInput.trim();

    if (data.bannedUsers?.[discordId.toString()]) {
      return { success: false, error: 'Your account is banned from accessing Veil Cloner.' };
    }

    const keyObj = data.keys?.[cleanKey];
    if (!keyObj) {
      return { success: false, error: 'Invalid license key. Please verify and try again.' };
    }

    if (keyObj.claimedBy && keyObj.claimedBy !== discordId.toString()) {
      return { success: false, error: 'This key has already been claimed by another Discord account.' };
    }

    const now = new Date();
    let expiresAt = null;

    if (keyObj.duration === '1d') {
      expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    } else if (keyObj.duration === '7d') {
      expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    } else if (keyObj.duration === '30d') {
      expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
    } else if (keyObj.duration === '90d') {
      expiresAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString();
    } else if (keyObj.duration === 'lifetime') {
      expiresAt = null;
    }

    keyObj.claimedBy = discordId.toString();
    keyObj.claimedUsername = username;
    keyObj.claimedAt = now.toISOString();
    keyObj.expiresAt = expiresAt;

    if (!data.users) data.users = {};
    data.users[discordId.toString()] = {
      discordId: discordId.toString(),
      username,
      key: cleanKey,
      duration: keyObj.duration,
      claimedAt: now.toISOString(),
      expiresAt
    };

    await saveData(data);
    return { success: true, license: data.users[discordId.toString()] };
  }
};
