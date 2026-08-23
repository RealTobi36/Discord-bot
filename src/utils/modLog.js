'use strict';

const db = require('../database');
const { baseEmbed } = require('./embeds');
const config = require('../../config');
const logger = require('../logger');

/**
 * Sendet eine Moderations-Aktion in den konfigurierten Mod-Log-Kanal.
 */
async function logModAction(guild, { color, title, description, fields = [], userId = null }) {
  try {
    const settings = db.getGuild(guild.id);
    if (!settings.modLogChannelId) return null;

    const channel = await guild.channels.fetch(settings.modLogChannelId).catch(() => null);
    if (!channel || !channel.isTextBased()) return null;

    const embed = baseEmbed({
      color: color || config.colors.primary,
      title,
      description,
      fields,
    });

    if (userId) {
      embed.setFooter({ text: `User ID: ${userId}` });
    }

    return channel.send({ embeds: [embed] });
  } catch (err) {
    logger.error('Fehler beim Senden der Mod-Log-Nachricht:', err);
    return null;
  }
}

module.exports = { logModAction };
