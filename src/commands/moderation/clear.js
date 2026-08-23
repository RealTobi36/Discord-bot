'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clear')
    .setDescription('Löscht mehrere Nachrichten im aktuellen Kanal')
    .addIntegerOption((o) =>
      o.setName('anzahl').setDescription('Anzahl der Nachrichten (1-100)').setMinValue(1).setMaxValue(100).setRequired(true),
    )
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Nur Nachrichten dieses Mitglieds löschen').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageMessages)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageMessages)) return;

    const amount = interaction.options.getInteger('anzahl');
    const target = interaction.options.getUser('mitglied');

    await interaction.deferReply({ flags: ['Ephemeral'] });

    try {
      let messages = await interaction.channel.messages.fetch({ limit: Math.min(amount + 1, 100) });
      // Die Interaktions-Nachricht selbst herausfiltern
      messages = messages.filter((m) => m.id !== interaction.id);

      if (target) {
        messages = messages.filter((m) => m.author.id === target.id);
      }

      // Nachrichten, die jünger als 14 Tage sind, lassen sich per bulkDelete löschen
      const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
      const deletable = messages.filter((m) => m.createdTimestamp > twoWeeksAgo);

      const deleted = await interaction.channel.bulkDelete(deletable, true);

      await interaction.editReply({
        embeds: [successEmbed(
          `${deleted.size} von ${amount} Nachrichten wurden gelöscht.${target ? ` (gefiltert nach ${target.tag})` : ''}${deleted.size < amount ? `\n*Hinweis: Nachrichten älter als 14 Tage können nicht per Bulk-Delete gelöscht werden.*` : ''}`,
          '🧹 Nachrichten gelöscht',
        )],
      });

      await logModAction(interaction.guild, {
        color: config.colors.info,
        title: '🧹 Nachrichten gelöscht',
        description: `**Kanal:** ${interaction.channel}\n**Moderator:** ${interaction.user.tag}\n**Anzahl:** ${deleted.size}${target ? `\n**Gefiltert nach:** ${target.tag}` : ''}`,
      });
    } catch (err) {
      logger.error('Clear-Fehler:', err);
      await interaction.editReply({ embeds: [errorEmbed('Nachrichten konnten nicht gelöscht werden.')] });
    }
  },
};
