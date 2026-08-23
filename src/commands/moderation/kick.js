'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modActionEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kickt ein Mitglied vom Server')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied, das gekickt werden soll').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund für den Kick').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.KickMembers)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.KickMembers)) return;

    const target = interaction.options.getMember('mitglied');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], flags: ['Ephemeral'] });
    }
    if (!canTargetMember(interaction, target)) return;

    try {
      try {
        await target.send({ embeds: [modActionEmbed({ action: 'Du wurdest gekickt', target, moderator: interaction.member, reason, color: config.colors.warning, emoji: config.emojis.kick })] });
      } catch { /* DMs deaktiviert */ }

      await target.kick(`${reason} (by ${interaction.user.tag})`);

      await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** wurde gekickt.\n**Grund:** ${reason}`)] });

      await logModAction(interaction.guild, {
        color: config.colors.warning,
        title: `${config.emojis.kick} Mitglied gekickt`,
        description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
        userId: target.id,
      });
    } catch (err) {
      logger.error('Kick-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Der Kick ist fehlgeschlagen.')], flags: ['Ephemeral'] });
    }
  },
};
