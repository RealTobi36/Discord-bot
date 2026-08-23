'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const { parseDuration, formatDuration } = require('../../utils/time');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Setzt den Slowmode eines Kanals')
    .addStringOption((o) =>
      o.setName('dauer').setDescription('z.B. 5s, 30s, 5m, 1h, oder 0 zum Deaktivieren').setRequired(true),
    )
    .addChannelOption((o) =>
      o.setName('kanal').setDescription('Kanal (Standard: aktueller Kanal)').addChannelTypes(ChannelType.GuildText),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageChannels)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageChannels)) return;

    const channel = interaction.options.getChannel('kanal') || interaction.channel;
    const input = interaction.options.getString('dauer');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

    let seconds;
    if (input === '0' || input.toLowerCase() === 'off' || input.toLowerCase() === 'aus') {
      seconds = 0;
    } else {
      const ms = parseDuration(input);
      if (!ms) {
        return interaction.reply({ embeds: [errorEmbed('Ungültige Dauer. Nutze z.B. `5s`, `30s`, `5m`, `1h` oder `0`.')], flags: ['Ephemeral'] });
      }
      seconds = Math.floor(ms / 1000);
      if (seconds > 21600) {
        return interaction.reply({ embeds: [errorEmbed('Der Slowmode darf maximal 6 Stunden (21600s) betragen.')], flags: ['Ephemeral'] });
      }
    }

    try {
      await channel.setRateLimitPerUser(seconds, `${reason} (by ${interaction.user.tag})`);

      const text = seconds === 0
        ? `Der Slowmode in ${channel} wurde deaktiviert.`
        : `Der Slowmode in ${channel} wurde auf **${formatDuration(seconds * 1000)}** gesetzt.`;

      await interaction.reply({ embeds: [successEmbed(text, '🐌 Slowmode')] });

      await logModAction(interaction.guild, {
        color: config.colors.info,
        title: '🐌 Slowmode geändert',
        description: `**Kanal:** ${channel}\n**Moderator:** ${interaction.user.tag}\n**Wert:** ${seconds === 0 ? 'Deaktiviert' : formatDuration(seconds * 1000)}\n**Grund:** ${reason}`,
      });
    } catch (err) {
      logger.error('Slowmode-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Der Slowmode konnte nicht gesetzt werden.')], flags: ['Ephemeral'] });
    }
  },
};
