import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { config } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.resolve(__dirname, '../../keys_data.json');

const OWNER_DISCORD_ID = "1240169071287205950";

let memoryCache = null;

// Helper to push keys_data.json to GitHub repository asynchronously in background
async function syncToGitHub(data) {
  if (!config.githubToken || !config.githubRepo) return;
  try {
    const jsonStr = JSON.stringify(data, null, 2);
    const contentB64 = Buffer.from(jsonStr).toString('base64');
    const url = `https://api.github.com/repos/${config.githubRepo}/contents/keys_data.json`;
    
    // Get existing sha
    let sha = null;
    try {
      const getRes = await axios.get(url, {
        headers: {
          Authorization: `Bearer ${config.githubToken}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      sha = getRes.data?.sha;
    } catch (_) {}

    const payload = {
      message: 'Auto-save keys database',
      content: contentB64,
      branch: 'main',
    };
    if (sha) payload.sha = sha;

    await axios.put(url, payload, {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
    });
    console.log('[AUTO-SYNC] Successfully synchronized keys_data.json to GitHub repository.');
  } catch (err) {
    console.error('[AUTO-SYNC ERROR]', err.response?.data?.message || err.message);
  }
}

// Helper to pull latest keys_data.json directly from GitHub on boot
async function pullFromGitHub() {
  if (!config.githubToken || !config.githubRepo) return;
  try {
    const url = `https://api.github.com/repos/${config.githubRepo}/contents/keys_data.json`;
    const res = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${config.githubToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    if (res.data?.content) {
      const decoded = Buffer.from(res.data.content, 'base64').toString('utf-8');
      const parsed = JSON.parse(decoded);
      if (parsed && typeof parsed === 'object') {
        memoryCache = parsed;
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
        console.log('[AUTO-SYNC] Successfully pulled latest keys database from GitHub repository on startup.');
      }
    }
  } catch (err) {
    console.error('[AUTO-SYNC PULL ERROR]', err.response?.data?.message || err.message);
  }
}

// Trigger cloud pull immediately when module loads
pullFromGitHub();

function loadData() {
  if (memoryCache) return memoryCache;
  if (!fs.existsSync(DATA_FILE)) {
    const initial = {
      keys: {},
      users: {},
      bannedUsers: {},
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    memoryCache = initial;
    return initial;
  }
  try {
    const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    if (parsed.keys?.["VEIL-OWNER-LIFETIME-ACCESS"]) {
      delete parsed.keys["VEIL-OWNER-LIFETIME-ACCESS"];
      fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2));
    }
    memoryCache = parsed;
    return parsed;
  } catch {
    memoryCache = { keys: {}, users: {}, bannedUsers: {} };
    return memoryCache;
  }
}

function saveData(data) {
  memoryCache = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('[KEY STORE SAVE ERROR]', err);
  }
  // Automatically persist to GitHub repository so future builds have all keys intact
  syncToGitHub(data);
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

  banUser(discordId, reason = 'Violating terms', bannedBy = 'Admin') {
    const data = loadData();
    if (!data.bannedUsers) data.bannedUsers = {};
    data.bannedUsers[discordId.toString()] = {
      discordId: discordId.toString(),
      reason,
      bannedBy,
      bannedAt: new Date().toISOString()
    };
    // Invalidate user license
    if (data.users?.[discordId.toString()]) {
      delete data.users[discordId.toString()];
    }
    saveData(data);
  },

  unbanUser(discordId) {
    const data = loadData();
    if (data.bannedUsers?.[discordId.toString()]) {
      delete data.bannedUsers[discordId.toString()];
      saveData(data);
      return true;
    }
    return false;
  },

  getBannedUsers() {
    const data = loadData();
    return Object.values(data.bannedUsers || {});
  },

  createKey({ duration = '30d', note = '', prefix = 'VEIL' }) {
    const data = loadData();
    if (!data.keys) data.keys = {};
    const key = generateKeyString(prefix);
    data.keys[key] = {
      key,
      duration, // '1d', '7d', '30d', '90d', 'lifetime'
      createdAt: new Date().toISOString(),
      claimedBy: null,
      claimedUsername: null,
      claimedAt: null,
      expiresAt: null,
      note
    };
    saveData(data);
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
      saveData(data);
      await syncToGitHub(data);
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

  importFullData(newData) {
    if (newData && typeof newData === 'object') {
      saveData(newData);
      return true;
    }
    return false;
  },

  getUserLicense(discordId) {
    if (!discordId) return null;
    const data = loadData();
    
    // Check if banned
    if (data.bannedUsers?.[discordId.toString()]) {
      return { active: false, banned: true, reason: data.bannedUsers[discordId.toString()].reason };
    }

    // Owner bypass
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

    // STRICT PER-ACCOUNT LOCK: If key was claimed by someone else, reject
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

    // Mark key as claimed and bind to this Discord ID
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

    saveData(data);
    await syncToGitHub(data);
    return { success: true, license: data.users[discordId.toString()] };
  }
};
