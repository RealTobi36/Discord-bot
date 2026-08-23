'use strict';

const { EmbedBuilder, time } = require('discord.js');
const config = require('../../config');

/**
 * Erstellt einen Standard-Embed.
 */
function baseEmbed({ color = config.colors.primary, title = null, description = null, fields = [], footer = null, timestamp = true } = {}) {
  const embed = new EmbedBuilder().setColor(color);
  if (title) embed.setTitle(title);
  if (description) embed.setDescription(description);
  if (fields.length) embed.addFields(fields);
  if (timestamp) embed.setTimestamp();
  if (footer) embed.setFooter(footer);
  return embed;
}

function successEmbed(description, title = 'Erfolg') {
  return baseEmbed({
    color: config.colors.success,
    title: `${config.emojis.success} ${title}`,
    description,
  });
}

function errorEmbed(description, title = 'Fehler') {
  return baseEmbed({
    color: config.colors.error,
    title: `${config.emojis.error} ${title}`,
    description,
  });
}

function warningEmbed(description, title = 'Warnung') {
  return baseEmbed({
    color: config.colors.warning,
    title: `${config.emojis.warning} ${title}`,
    description,
  });
}

function infoEmbed(description, title = 'Info') {
  return baseEmbed({
    color: config.colors.info,
    title: `${config.emojis.info} ${title}`,
    description,
  });
}

/**
 * Moderations-Embed für Logs und DM-Benachrichtigungen.
 */
function modActionEmbed({ action, target, moderator, reason, duration, color, emoji }) {
  const fields = [
    { name: '👤 Mitglied', value: `${target.user.tag} (\`${target.id}\`)`, inline: true },
    { name: '🛡️ Moderator', value: `${moderator.user.tag}`, inline: true },
  ];

  if (duration) {
    fields.push({ name: '⏱️ Dauer', value: duration, inline: true });
  }

  fields.push({ name: '📝 Grund', value: reason || 'Kein Grund angegeben' });

  return new EmbedBuilder()
    .setColor(color || config.colors.primary)
    .setTitle(`${emoji || ''} ${action}`.trim())
    .setThumbnail(target.user.displayAvatarURL())
    .addFields(fields)
    .setTimestamp();
}

module.exports = {
  baseEmbed,
  successEmbed,
  errorEmbed,
  warningEmbed,
  infoEmbed,
  modActionEmbed,
};
