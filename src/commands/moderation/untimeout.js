'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('untimeout')
    .setDescription('Hebt den Timeout eines Mitglieds auf')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ModerateMembers)) return;

    const target = interaction.options.getMember('mitglied');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

    if (!target) return interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], flags: ['Ephemeral'] });
    if (!canTargetMember(interaction, target)) return;
    if (!target.communicationDisabledUntil) {
      return interaction.reply({ embeds: [errorEmbed('Dieses Mitglied ist nicht im Timeout.')], flags: ['Ephemeral'] });
    }

    try {
      await target.timeout(null, `${reason} (by ${interaction.user.tag})`);
      await interaction.reply({ embeds: [successEmbed(`Der Timeout von **${target.user.tag}** wurde aufgehoben.`)] });

      await logModAction(interaction.guild, {
        color: config.colors.success,
        title: '🔊 Timeout aufgehoben',
        description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
        userId: target.id,
      });
    } catch (err) {
      logger.error('Untimeout-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Aufhebung fehlgeschlagen.')], flags: ['Ephemeral'] });
    }
  },
};
