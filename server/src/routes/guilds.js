import express from 'express';
import { ChannelType } from 'discord.js';
import { getClient, getGuild } from '../bot/client.js';
import { config } from '../config.js';

export const guildsRouter = express.Router();

// Helper to check if permissions bitfield contains ADMIN (0x8) or MANAGE_GUILD (0x20)
function hasManageGuild(permissions) {
  if (!permissions) return false;
  const p = BigInt(permissions);
  const ADMINISTRATOR = 0x8n;
  const MANAGE_GUILD = 0x20n;
  return (p & ADMINISTRATOR) === ADMINISTRATOR || (p & MANAGE_GUILD) === MANAGE_GUILD;
}

// GET /api/guilds
guildsRouter.get('/', async (req, res) => {
  const client = getClient();
  const botGuilds = client ? Array.from(client.guilds.cache.values()) : [];

  // If user is authenticated via Discord OAuth
  const userGuilds = req.session?.userGuilds || [];

  if (userGuilds.length > 0) {
    // Filter mutual guilds where user has MANAGE_GUILD
    const manageableUserGuilds = userGuilds.filter((g) => g.owner || hasManageGuild(g.permissions));

    const mutualGuilds = [];
    const nonBotGuilds = [];

    for (const g of manageableUserGuilds) {
      const botGuild = botGuilds.find((bg) => bg.id === g.id);
      const iconUrl = g.icon
        ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.png`
        : null;

      if (botGuild) {
        mutualGuilds.push({
          id: g.id,
          name: g.name,
          icon: iconUrl,
          memberCount: botGuild.memberCount,
          botPresent: true,
          rolesCount: botGuild.roles.cache.size,
          channelsCount: botGuild.channels.cache.size,
        });
      } else {
        nonBotGuilds.push({
          id: g.id,
          name: g.name,
          icon: iconUrl,
          botPresent: false,
          inviteUrl: `https://discord.com/oauth2/authorize?client_id=${config.discord.clientId}&guild_id=${g.id}&permissions=8&scope=bot+applications.commands`,
        });
      }
    }

    return res.json({
      mutualGuilds,
      nonBotGuilds,
      botInviteUrl: config.discord.botInviteUrl,
    });
  }

  // If no user guilds in session, return empty
  return res.json({
    mutualGuilds: [],
    nonBotGuilds: [],
    botInviteUrl: config.discord.botInviteUrl,
  });
});

// GET /api/guilds/:id/details
guildsRouter.get('/:id/details', async (req, res) => {
  const { id } = req.params;
  const guild = getGuild(id);

  if (!guild) {
    return res.status(404).json({ error: 'Server not found or bot is not in this server.' });
  }

  try {
    const [roles, channels, emojis, stickers] = await Promise.all([
      guild.roles.fetch(),
      guild.channels.fetch(),
      guild.emojis.fetch().catch(() => new Map()),
      guild.stickers.fetch().catch(() => new Map()),
    ]);

    const formattedRoles = Array.from(roles.values())
      .filter((r) => r.name !== '@everyone' && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
      }));

    // Group channels by category
    const categories = [];
    const uncategorizedChannels = [];

    const categoryMap = new Map();
    channels.forEach((ch) => {
      if (!ch) return;
      if (ch.type === ChannelType.GuildCategory) {
        categoryMap.set(ch.id, {
          id: ch.id,
          name: ch.name,
          position: ch.position,
          channels: [],
        });
      }
    });

    channels.forEach((ch) => {
      if (!ch || ch.type === ChannelType.GuildCategory) return;
      const channelData = {
        id: ch.id,
        name: ch.name,
        type: ch.type,
        position: ch.position,
        parentId: ch.parentId,
      };

      if (ch.parentId && categoryMap.has(ch.parentId)) {
        categoryMap.get(ch.parentId).channels.push(channelData);
      } else {
        uncategorizedChannels.push(channelData);
      }
    });

    // Sort category channels
    categoryMap.forEach((cat) => {
      cat.channels.sort((a, b) => a.position - b.position);
      categories.push(cat);
    });
    categories.sort((a, b) => a.position - b.position);

    if (uncategorizedChannels.length > 0) {
      uncategorizedChannels.sort((a, b) => a.position - b.position);
      categories.unshift({
        id: 'uncategorized',
        name: 'UNCATEGORIZED',
        position: -1,
        channels: uncategorizedChannels,
      });
    }

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      banner: guild.bannerURL(),
      description: guild.description,
      memberCount: guild.memberCount,
      verificationLevel: guild.verificationLevel,
      roles: formattedRoles,
      categories,
      emojisCount: emojis.size,
      stickersCount: stickers.size,
    });
  } catch (error) {
    console.error('[GUILD DETAILS ERROR]', error);
    res.status(500).json({ error: 'Failed to fetch guild details: ' + error.message });
  }
});
