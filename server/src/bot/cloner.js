import { ChannelType, PermissionFlagsBits, OverwriteType } from 'discord.js';
import axios from 'axios';
import { getGuild } from './client.js';
import { cleanTargetGuild } from './cleaner.js';
import { logger } from '../utils/logger.js';

// Map of active cancel tokens: jobId -> boolean
export const activeJobs = new Map();

/**
 * Executes full or selective cloning from source guild to target guild.
 */
export async function cloneGuild({ jobId, sourceGuildId, targetGuildId, options }) {
  activeJobs.set(jobId, false); // false = not cancelled

  const log = (type, message) => logger.log(jobId, type, message);
  const isCancelled = () => activeJobs.get(jobId) === true;

  logger.setJobStatus(jobId, 'running');

  try {
    const sourceGuild = getGuild(sourceGuildId);
    const targetGuild = getGuild(targetGuildId);

    if (!sourceGuild) {
      throw new Error(`Source guild (${sourceGuildId}) not found or bot lacks access.`);
    }
    if (!targetGuild) {
      throw new Error(`Target guild (${targetGuildId}) not found or bot lacks access.`);
    }

    log('step', `[1/7] Initializing clone from "${sourceGuild.name}" -> "${targetGuild.name}"`);

    // 1. Cleanup Target if requested
    if (options.clearTarget) {
      log('step', '[2/7] Cleaning Target Server...');
      await cleanTargetGuild(
        targetGuild,
        {
          clearChannels: options.clearTargetOptions?.channels ?? true,
          clearRoles: options.clearTargetOptions?.roles ?? true,
          clearEmojis: options.clearTargetOptions?.emojis ?? false,
          clearStickers: options.clearTargetOptions?.stickers ?? false,
          clearIcon: options.clearTargetOptions?.icon ?? false,
          clearBanner: options.clearTargetOptions?.banner ?? false,
        },
        { log, isCancelled }
      );
    } else {
      log('info', 'Skipping target server cleanup.');
    }

    if (isCancelled()) {
      log('warn', 'Clone cancelled by user.');
      logger.setJobStatus(jobId, 'stopped');
      return;
    }

    // 2. Clone Guild Settings (Name, Icon, Banner, etc.)
    log('step', '[3/7] Cloning Guild Details & Branding...');
    const guildEdit = {};
    if (options.cloneName) {
      guildEdit.name = sourceGuild.name;
    }
    if (options.cloneIcon && sourceGuild.iconURL()) {
      try {
        const iconRes = await axios.get(sourceGuild.iconURL({ extension: 'png', size: 1024 }), {
          responseType: 'arraybuffer',
        });
        guildEdit.icon = Buffer.from(iconRes.data);
      } catch (err) {
        log('warn', `Failed fetching source icon: ${err.message}`);
      }
    }
    if (options.cloneBanner && sourceGuild.bannerURL()) {
      try {
        const bannerRes = await axios.get(sourceGuild.bannerURL({ extension: 'png', size: 1024 }), {
          responseType: 'arraybuffer',
        });
        guildEdit.banner = Buffer.from(bannerRes.data);
      } catch (err) {
        log('warn', `Failed fetching source banner: ${err.message}`);
      }
    }
    if (options.cloneVerification && sourceGuild.verificationLevel !== undefined) {
      guildEdit.verificationLevel = sourceGuild.verificationLevel;
    }

    if (Object.keys(guildEdit).length > 0) {
      try {
        await targetGuild.edit(guildEdit);
        log('success', 'Server details updated.');
      } catch (err) {
        log('warn', `Failed updating server details: ${err.message}`);
      }
    }

    // 3. Clone Roles
    const roleMapping = new Map(); // sourceRoleId -> targetRoleId
    // Map @everyone
    roleMapping.set(sourceGuild.roles.everyone.id, targetGuild.roles.everyone.id);

    if (options.roles && (options.roles.mode === 'all' || options.roles.mode === 'custom')) {
      log('step', '[4/7] Cloning Roles...');
      try {
        const sourceRoles = await sourceGuild.roles.fetch();
        const sortedRoles = Array.from(sourceRoles.values())
          .filter((r) => r.name !== '@everyone' && !r.managed)
          .sort((a, b) => a.position - b.position); // Create from lowest to highest

        const rolesToClone =
          options.roles.mode === 'all'
            ? sortedRoles
            : sortedRoles.filter((r) => options.roles.roleIds?.includes(r.id));

        log('info', `Cloning ${rolesToClone.length} role(s)...`);

        for (const role of rolesToClone) {
          if (isCancelled()) break;
          try {
            // Check if role icon exists (if bot guild is boosted to Level 2)
            let iconBuffer = null;
            if (role.iconURL()) {
              try {
                const iconRes = await axios.get(role.iconURL({ extension: 'png' }), {
                  responseType: 'arraybuffer',
                });
                iconBuffer = Buffer.from(iconRes.data);
              } catch (_) {}
            }

            let newRole = null;
            try {
              newRole = await targetGuild.roles.create({
                name: role.name,
                color: role.color,
                hoist: role.hoist,
                permissions: role.permissions,
                mentionable: role.mentionable,
                icon: iconBuffer,
                reason: 'Discord Cloner role recreation',
              });
            } catch (createErr) {
              // If target server lacks Boost Level 2 for role icons, retry creating without icon
              if (iconBuffer) {
                newRole = await targetGuild.roles.create({
                  name: role.name,
                  color: role.color,
                  hoist: role.hoist,
                  permissions: role.permissions,
                  mentionable: role.mentionable,
                  reason: 'Discord Cloner role recreation (without icon)',
                });
              } else {
                throw createErr;
              }
            }

            roleMapping.set(role.id, newRole.id);
            log('info', `Created role: @${role.name}`);
          } catch (err) {
            log('warn', `Could not create role @${role.name}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 350));
        }

        // Update @everyone permissions
        try {
          await targetGuild.roles.everyone.setPermissions(
            sourceGuild.roles.everyone.permissions,
            'Discord Cloner @everyone permissions sync'
          );
          log('success', 'Synchronized @everyone permissions.');
        } catch (err) {
          log('warn', `Failed syncing @everyone permissions: ${err.message}`);
        }

        log('success', 'Roles cloning completed.');
      } catch (err) {
        log('error', `Failed cloning roles: ${err.message}`);
      }
    }

    if (isCancelled()) {
      log('warn', 'Clone cancelled by user.');
      logger.setJobStatus(jobId, 'stopped');
      return;
    }

    // 4. Clone Channels & Categories
    const channelMapping = new Map(); // sourceChannelId -> targetChannelId

    if (options.channels && (options.channels.mode === 'all' || options.channels.mode === 'custom')) {
      log('step', '[5/7] Cloning Channels and Categories...');
      try {
        const sourceChannels = await sourceGuild.channels.fetch();
        const allChannels = Array.from(sourceChannels.values()).filter(Boolean);

        const channelsToClone =
          options.channels.mode === 'all'
            ? allChannels
            : allChannels.filter((c) => options.channels.channelIds?.includes(c.id));

        // Helper function to build permission overwrites
        const buildOverwrites = (channel) => {
          const overwrites = [];
          for (const [id, overwrite] of channel.permissionOverwrites.cache) {
            let targetId = null;
            if (overwrite.type === OverwriteType.Role) {
              targetId = roleMapping.get(id);
            } else if (overwrite.type === OverwriteType.Member) {
              // Only keep member overwrite if target guild has the member
              if (targetGuild.members.cache.has(id)) {
                targetId = id;
              }
            }

            if (targetId) {
              overwrites.push({
                id: targetId,
                type: overwrite.type,
                allow: overwrite.allow,
                deny: overwrite.deny,
              });
            }
          }
          return overwrites;
        };

        // First pass: Categories
        const categories = channelsToClone
          .filter((c) => c.type === ChannelType.GuildCategory)
          .sort((a, b) => a.position - b.position);

        log('info', `Cloning ${categories.length} category(ies)...`);
        for (const cat of categories) {
          if (isCancelled()) break;
          try {
            const newCat = await targetGuild.channels.create({
              name: cat.name,
              type: ChannelType.GuildCategory,
              position: cat.position,
              permissionOverwrites: buildOverwrites(cat),
              reason: 'Discord Cloner Category recreation',
            });
            channelMapping.set(cat.id, newCat.id);
            log('info', `Created category: [📁 ${cat.name}]`);
          } catch (err) {
            log('warn', `Could not create category ${cat.name}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 400));
        }

        // Second pass: Non-Category channels
        const nonCategories = channelsToClone
          .filter((c) => c.type !== ChannelType.GuildCategory)
          .sort((a, b) => a.position - b.position);

        log('info', `Cloning ${nonCategories.length} channel(s)...`);
        for (const ch of nonCategories) {
          if (isCancelled()) break;
          try {
            let parentId = null;
            if (ch.parentId && channelMapping.has(ch.parentId)) {
              parentId = channelMapping.get(ch.parentId);
            }

            const channelPayload = {
              name: ch.name,
              type: ch.type,
              topic: ch.topic || undefined,
              nsfw: ch.nsfw || false,
              bitrate: ch.bitrate || undefined,
              userLimit: ch.userLimit || undefined,
              rateLimitPerUser: ch.rateLimitPerUser || undefined,
              position: ch.position,
              parent: parentId,
              permissionOverwrites: buildOverwrites(ch),
              reason: 'Discord Cloner Channel recreation',
            };

            // Remove unsupported attributes per channel type
            if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice) {
              delete channelPayload.topic;
              delete channelPayload.nsfw;
              delete channelPayload.rateLimitPerUser;
            } else {
              delete channelPayload.bitrate;
              delete channelPayload.userLimit;
            }

            // Announcement channel fallback if server is not community
            if (ch.type === ChannelType.GuildAnnouncement && !targetGuild.features.includes('COMMUNITY')) {
              channelPayload.type = ChannelType.GuildText;
            }

            const newChannel = await targetGuild.channels.create(channelPayload);
            channelMapping.set(ch.id, newChannel.id);
            log('info', `Created channel: #${ch.name}`);
          } catch (err) {
            log('warn', `Could not create channel #${ch.name}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 400));
        }

        log('success', 'Channels and categories cloned.');
      } catch (err) {
        log('error', `Failed cloning channels: ${err.message}`);
      }
    }

    if (isCancelled()) {
      log('warn', 'Clone cancelled by user.');
      logger.setJobStatus(jobId, 'stopped');
      return;
    }

    // 5. Clone Emojis & Stickers
    if (options.cloneEmojis) {
      log('step', '[6/7] Cloning Custom Emojis...');
      try {
        const emojis = await sourceGuild.emojis.fetch();
        log('info', `Found ${emojis.size} emoji(s) in source.`);
        for (const [id, emoji] of emojis) {
          if (isCancelled()) break;
          try {
            await targetGuild.emojis.create({
              attachment: emoji.url,
              name: emoji.name,
              reason: 'Discord Cloner emoji copy',
            });
            log('info', `Cloned emoji :${emoji.name}:`);
          } catch (err) {
            log('warn', `Could not clone emoji :${emoji.name}:: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        log('success', 'Emojis cloning finished.');
      } catch (err) {
        log('error', `Failed cloning emojis: ${err.message}`);
      }
    }

    if (options.cloneStickers) {
      log('info', 'Cloning Custom Stickers...');
      try {
        const stickers = await sourceGuild.stickers.fetch();
        log('info', `Found ${stickers.size} sticker(s) in source.`);
        for (const [id, sticker] of stickers) {
          if (isCancelled()) break;
          try {
            await targetGuild.stickers.create({
              file: sticker.url,
              name: sticker.name,
              tags: sticker.tags || 'cloned',
              description: sticker.description || '',
              reason: 'Discord Cloner sticker copy',
            });
            log('info', `Cloned sticker: ${sticker.name}`);
          } catch (err) {
            log('warn', `Could not clone sticker ${sticker.name}: ${err.message}`);
          }
          await new Promise((r) => setTimeout(r, 500));
        }
        log('success', 'Stickers cloning finished.');
      } catch (err) {
        log('error', `Failed cloning stickers: ${err.message}`);
      }
    }

    // 6. Clone Messages (via Webhooks for author impersonation)
    if (options.messages && options.messages.enabled) {
      log('step', '[7/7] Cloning Channel Messages...');
      const msgLimit = Math.min(options.messages.limitPerChannel || 50, 100);
      const cloneAttachments = options.messages.cloneAttachments ?? true;

      const targetTextChannels = channelMapping.entries();

      for (const [sourceId, targetId] of targetTextChannels) {
        if (isCancelled()) break;
        try {
          const sourceChannel = await sourceGuild.channels.fetch(sourceId).catch(() => null);
          const targetChannel = await targetGuild.channels.fetch(targetId).catch(() => null);

          if (!sourceChannel || !targetChannel || !sourceChannel.isTextBased() || !targetChannel.isTextBased()) {
            continue;
          }

          log('info', `Fetching last ${msgLimit} messages from #${sourceChannel.name}...`);
          const messages = await sourceChannel.messages.fetch({ limit: msgLimit });
          const chronologicalMessages = Array.from(messages.values()).reverse();

          if (chronologicalMessages.length === 0) continue;

          // Create temporary webhook in target channel
          let webhook = null;
          try {
            webhook = await targetChannel.createWebhook({
              name: 'Cloner-Relay',
              reason: 'Temporary webhook for historical message cloning',
            });
          } catch (whErr) {
            log('warn', `Webhook creation failed for #${targetChannel.name}: ${whErr.message}. Falling back to standard message send.`);
          }

          for (const msg of chronologicalMessages) {
            if (isCancelled()) break;
            if (!msg.content && msg.attachments.size === 0 && msg.embeds.length === 0) continue;

            const files = [];
            if (cloneAttachments && msg.attachments.size > 0) {
              for (const [_, att] of msg.attachments) {
                files.push({
                  attachment: att.url,
                  name: att.name,
                });
              }
            }

            try {
              if (webhook) {
                await webhook.send({
                  content: msg.content || undefined,
                  username: msg.member?.displayName || msg.author.username,
                  avatarURL: msg.author.displayAvatarURL(),
                  embeds: msg.embeds.slice(0, 10),
                  files: files.slice(0, 5),
                });
              } else {
                await targetChannel.send({
                  content: `**[${msg.author.username}]**: ${msg.content || ''}`,
                  embeds: msg.embeds.slice(0, 10),
                  files: files.slice(0, 5),
                });
              }
            } catch (sendErr) {
              // Rate limit or embed error
            }
            await new Promise((r) => setTimeout(r, 600)); // Discord webhook rate limit safety
          }

          // Cleanup Webhook
          if (webhook) {
            await webhook.delete('Cloning complete for channel').catch(() => {});
          }

          log('success', `Cloned ${chronologicalMessages.length} messages in #${targetChannel.name}`);
        } catch (err) {
          log('warn', `Failed cloning messages for channel ${sourceId}: ${err.message}`);
        }
      }
    }

    log('success', `🎉 Server clone completed successfully from "${sourceGuild.name}" -> "${targetGuild.name}"!`);
    logger.setJobStatus(jobId, 'completed');
  } catch (error) {
    log('error', `Clone failed with error: ${error.message}`);
    logger.setJobStatus(jobId, 'failed');
  } finally {
    activeJobs.delete(jobId);
  }
}

export function stopJob(jobId) {
  if (activeJobs.has(jobId)) {
    activeJobs.set(jobId, true);
    return true;
  }
  // Even if not in active map, register cancelled token
  activeJobs.set(jobId, true);
  return true;
}
