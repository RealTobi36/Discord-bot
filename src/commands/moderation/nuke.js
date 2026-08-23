'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('nuke')
    .setDescription('Setzt den aktuellen Kanal zurück (klont den Kanal und löscht den alten)')
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageChannels)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageChannels)) return;

    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const channel = interaction.channel;

    try {
      // Klone den Kanal (gleiche Einstellungen, Berechtigungen, Thema, Name)
      const cloned = await channel.clone({
        name: channel.name,
        reason: `Kanal zurückgesetzt: ${reason} (by ${interaction.user.tag})`,
      });

      await cloned.setPosition(channel.position);
      await channel.delete(`Kanal zurückgesetzt: ${reason} (by ${interaction.user.tag})`);

      await cloned.send({
        embeds: [successEmbed(`Dieser Kanal wurde zurückgesetzt.\n**Grund:** ${reason}\n**Moderator:** ${interaction.user.tag}`, '💥 Kanal zurückgesetzt')],
      });

      await logModAction(interaction.guild, {
        color: config.colors.error,
        title: '💥 Kanal zurückgesetzt',
        description: `**Alter Kanal:** #${channel.name}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
      });
    } catch (err) {
      logger.error('Nuke-Fehler:', err);
      try {
        await interaction.reply({ embeds: [errorEmbed('Der Kanal konnte nicht zurückgesetzt werden.')], flags: ['Ephemeral'] });
      } catch { /* Channel already deleted */ }
    }
  },
};
