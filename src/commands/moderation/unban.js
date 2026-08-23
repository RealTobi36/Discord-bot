'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Hebt den Ban eines Mitglieds auf')
    .addStringOption((o) =>
      o.setName('nutzer-id').setDescription('Die User-ID des entbannten Mitglieds').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund für die Aufhebung').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.BanMembers)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.BanMembers)) return;

    const userId = interaction.options.getString('nutzer-id');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

    if (!/^\d{17,20}$/.test(userId)) {
      return interaction.reply({ embeds: [errorEmbed('Bitte gib eine gültige User-ID an.')], flags: ['Ephemeral'] });
    }

    try {
      await interaction.guild.bans.remove(userId, `${reason} (by ${interaction.user.tag})`);
      const user = await interaction.client.users.fetch(userId).catch(() => null);

      await interaction.reply({
        embeds: [successEmbed(`**${user ? user.tag : userId}** wurde entbannt.\n**Grund:** ${reason}`)],
      });

      await logModAction(interaction.guild, {
        color: config.colors.success,
        title: '🔓 Ban aufgehoben',
        description: `**Nutzer:** ${user ? user.tag : userId}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
        userId,
      });
    } catch (err) {
      logger.error('Unban-Fehler:', err);
      await interaction.reply({
        embeds: [errorEmbed('Der Nutzer ist nicht gebannt oder die ID ist ungültig.')],
        flags: ['Ephemeral'],
      });
    }
  },
};
