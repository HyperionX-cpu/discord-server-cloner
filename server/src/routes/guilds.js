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

  // Fallback if no OAuth user guilds (e.g. demo mode or direct bot cache)
  const mutualGuilds = botGuilds.map((bg) => ({
    id: bg.id,
    name: bg.name,
    icon: bg.iconURL(),
    memberCount: bg.memberCount,
    botPresent: true,
    rolesCount: bg.roles.cache.size,
    channelsCount: bg.channels.cache.size,
  }));

  // Demo fallback guilds if bot has no guilds connected yet
  if (mutualGuilds.length === 0) {
    mutualGuilds.push(
      {
        id: '111111111111111111',
        name: 'Hyperion Gaming Lounge [Source]',
        icon: null,
        memberCount: 1420,
        botPresent: true,
        rolesCount: 18,
        channelsCount: 34,
      },
      {
        id: '222222222222222222',
        name: 'Community Backup [Target]',
        icon: null,
        memberCount: 5,
        botPresent: true,
        rolesCount: 3,
        channelsCount: 4,
      }
    );
  }

  res.json({
    mutualGuilds,
    nonBotGuilds: [],
    botInviteUrl: config.discord.botInviteUrl,
  });
});

// GET /api/guilds/:id/details
guildsRouter.get('/:id/details', async (req, res) => {
  const { id } = req.params;
  const guild = getGuild(id);

  if (!guild) {
    // If demo guild
    if (id === '111111111111111111' || id === '222222222222222222') {
      return res.json({
        id,
        name: id === '111111111111111111' ? 'Hyperion Gaming Lounge [Source]' : 'Community Backup [Target]',
        icon: null,
        banner: null,
        description: 'Demo server environment for previewing features.',
        memberCount: id === '111111111111111111' ? 1420 : 5,
        verificationLevel: 1,
        roles: [
          { id: '101', name: '👑 Owner', color: '#ff0055', position: 10 },
          { id: '102', name: '🛡️ Admin', color: '#3b82f6', position: 9 },
          { id: '103', name: '⚔️ Moderator', color: '#10b981', position: 8 },
          { id: '104', name: '⭐ VIP', color: '#f59e0b', position: 7 },
          { id: '105', name: '🎮 Member', color: '#8b5cf6', position: 6 },
        ],
        categories: [
          {
            id: 'c1',
            name: 'INFORMATION',
            position: 0,
            channels: [
              { id: 'ch1', name: 'rules-and-info', type: ChannelType.GuildText },
              { id: 'ch2', name: 'announcements', type: ChannelType.GuildAnnouncement },
            ],
          },
          {
            id: 'c2',
            name: 'COMMUNITY CHAT',
            position: 1,
            channels: [
              { id: 'ch3', name: 'general-chat', type: ChannelType.GuildText },
              { id: 'ch4', name: 'media-and-clips', type: ChannelType.GuildText },
              { id: 'ch5', name: 'bot-commands', type: ChannelType.GuildText },
            ],
          },
          {
            id: 'c3',
            name: 'VOICE LOUNGES',
            position: 2,
            channels: [
              { id: 'ch6', name: 'General Voice 1', type: ChannelType.GuildVoice },
              { id: 'ch7', name: 'Gaming Duo 1', type: ChannelType.GuildVoice },
            ],
          },
        ],
        emojisCount: 32,
        stickersCount: 8,
      });
    }

    return res.status(404).json({ error: 'Guild not found or bot lacks access.' });
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
