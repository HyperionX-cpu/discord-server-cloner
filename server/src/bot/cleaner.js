/**
 * Cleans elements of the target guild safely according to options.
 * @param {import('discord.js').Guild} targetGuild
 * @param {Object} options
 * @param {Object} loggerContext { log: (type, msg) => void, isCancelled: () => boolean }
 */
export async function cleanTargetGuild(targetGuild, options = {}, loggerContext) {
  const { log, isCancelled } = loggerContext;

  log('step', `=== Starting cleanup on Target Guild: ${targetGuild.name} (${targetGuild.id}) ===`);

  // 1. Clear Channels
  if (options.clearChannels) {
    log('info', 'Clearing existing channels...');
    try {
      const channels = await targetGuild.channels.fetch();
      for (const [id, channel] of channels) {
        if (isCancelled && isCancelled()) {
          log('warn', 'Cleanup aborted by user.');
          return;
        }
        if (!channel) continue;
        try {
          await channel.delete('Cloner target server channel cleanup');
          log('info', `Deleted channel: #${channel.name}`);
        } catch (err) {
          log('warn', `Could not delete channel #${channel.name}: ${err.message}`);
        }
        await new Promise((r) => setTimeout(r, 250)); // rate limit buffer
      }
      log('success', 'All eligible channels deleted.');
    } catch (err) {
      log('error', `Failed fetching/deleting channels: ${err.message}`);
    }
  }

  // 2. Clear Roles
  if (options.clearRoles) {
    log('info', 'Clearing existing custom roles...');
    try {
      const roles = await targetGuild.roles.fetch();
      let deletedCount = 0;

      // Filter out @everyone and bot integration-managed roles (which Discord hard-locks)
      const purgeableRoles = Array.from(roles.values()).filter(
        (r) => r.name !== '@everyone' && r.id !== targetGuild.id && !r.managed
      );

      // Sort from lowest to highest position
      purgeableRoles.sort((a, b) => a.position - b.position);

      for (const role of purgeableRoles) {
        if (isCancelled && isCancelled()) {
          log('warn', 'Cleanup aborted by user.');
          return;
        }

        try {
          await role.delete('Cloner target server role cleanup');
          deletedCount++;
          log('info', `Deleted role: @${role.name}`);
        } catch (err) {
          log('warn', `Could not delete role @${role.name}: ${err.message} (Make sure bot's role is dragged to the top in Server Settings -> Roles)`);
        }
        await new Promise((r) => setTimeout(r, 150));
      }
      log('success', `Custom roles purge completed (${deletedCount}/${purgeableRoles.length} roles deleted).`);
    } catch (err) {
      log('error', `Failed clearing roles: ${err.message}`);
    }
  }

  // 3. Clear Emojis
  if (options.clearEmojis) {
    log('info', 'Clearing custom emojis...');
    try {
      const emojis = await targetGuild.emojis.fetch();
      for (const [id, emoji] of emojis) {
        if (isCancelled && isCancelled()) return;
        try {
          await emoji.delete('Cloner target emoji cleanup');
          log('info', `Deleted emoji: :${emoji.name}:`);
        } catch (err) {
          log('warn', `Could not delete emoji :${emoji.name}:: ${err.message}`);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      log('success', 'Emojis cleared.');
    } catch (err) {
      log('error', `Failed clearing emojis: ${err.message}`);
    }
  }

  // 4. Clear Stickers
  if (options.clearStickers) {
    log('info', 'Clearing custom stickers...');
    try {
      const stickers = await targetGuild.stickers.fetch();
      for (const [id, sticker] of stickers) {
        if (isCancelled && isCancelled()) return;
        try {
          await sticker.delete('Cloner target sticker cleanup');
          log('info', `Deleted sticker: ${sticker.name}`);
        } catch (err) {
          log('warn', `Could not delete sticker ${sticker.name}: ${err.message}`);
        }
        await new Promise((r) => setTimeout(r, 250));
      }
      log('success', 'Stickers cleared.');
    } catch (err) {
      log('error', `Failed clearing stickers: ${err.message}`);
    }
  }

  // 5. Clear Icon & Banner
  if (options.clearIcon || options.clearBanner) {
    try {
      const editPayload = {};
      if (options.clearIcon) editPayload.icon = null;
      if (options.clearBanner) editPayload.banner = null;
      await targetGuild.edit(editPayload);
      log('success', 'Server icon/banner reset.');
    } catch (err) {
      log('warn', `Could not reset icon/banner: ${err.message}`);
    }
  }

  log('success', 'Target server cleanup finished.');
}
