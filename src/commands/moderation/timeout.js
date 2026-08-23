'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, modActionEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const { parseDuration, formatDuration, relativeTimestamp } = require('../../utils/time');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Setzt ein Mitglied in den Timeout (Discord-native Stummschaltung)')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('dauer').setDescription('z.B. 10m, 1h, 7d (max. 28 Tage)').setRequired(true),
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
    const durationInput = interaction.options.getString('dauer');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const ms = parseDuration(durationInput);

    if (!ms || ms <= 0 || ms > 28 * 24 * 60 * 60 * 1000) {
      return interaction.reply({
        embeds: [errorEmbed('Ungültige Dauer. Nutze z.B. `10m`, `1h`, `7d` (max. 28 Tage).')],
        flags: ['Ephemeral'],
      });
    }
    if (!target) {
      return interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], flags: ['Ephemeral'] });
    }
    if (!canTargetMember(interaction, target)) return;

    try {
      await target.timeout(ms, `${reason} (by ${interaction.user.tag})`);
      const until = new Date(Date.now() + ms);

      try {
        await target.send({ embeds: [modActionEmbed({
          action: 'Du wurdest in den Timeout versetzt',
          target,
          moderator: interaction.member,
          reason,
          duration: formatDuration(ms),
          color: config.colors.warning,
          emoji: '⏱️',
        })] });
      } catch { /* DMs deaktiviert */ }

      await interaction.reply({
        embeds: [successEmbed(`**${target.user.tag}** wurde für **${formatDuration(ms)}** in den Timeout versetzt (endet ${relativeTimestamp(until)}).\n**Grund:** ${reason}`)],
      });

      await logModAction(interaction.guild, {
        color: config.colors.warning,
        title: '⏱️ Mitglied im Timeout',
        description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Dauer:** ${formatDuration(ms)}\n**Endet:** ${relativeTimestamp(until)}\n**Grund:** ${reason}`,
        userId: target.id,
      });
    } catch (err) {
      logger.error('Timeout-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Der Timeout ist fehlgeschlagen.')], flags: ['Ephemeral'] });
    }
  },
};
