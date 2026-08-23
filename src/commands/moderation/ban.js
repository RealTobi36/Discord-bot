'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { modActionEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bannt ein Mitglied vom Server')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied, das gebannt werden soll').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund für den Ban').setRequired(false),
    )
    .addIntegerOption((o) =>
      o.setName('nachrichten-löschen').setDescription('Nachrichten der letzten X Sekunden löschen (0-604800)').setMinValue(0).setMaxValue(604800),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.BanMembers)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.BanMembers)) return;

    const target = interaction.options.getMember('mitglied');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const deleteSeconds = interaction.options.getInteger('nachrichten-löschen') ?? 0;

    if (!target) {
      return interaction.reply({
        embeds: [errorEmbed('Dieses Mitglied konnte nicht gefunden werden.')],
        flags: ['Ephemeral'],
      });
    }

    if (!canTargetMember(interaction, target)) return;

    try {
      // DM vor dem Ban senden
      try {
        await target.send({
          embeds: [modActionEmbed({
            action: 'Du wurdest gebannt',
            target,
            moderator: interaction.member,
            reason,
            color: config.colors.error,
            emoji: config.emojis.ban,
          })],
        });
      } catch { /* DMs deaktiviert */ }

      await target.ban({ deleteMessageSeconds: deleteSeconds, reason: `${reason} (by ${interaction.user.tag})` });

      await interaction.reply({
        embeds: [successEmbed(`**${target.user.tag}** wurde gebannt.\n**Grund:** ${reason}`)],
      });

      await logModAction(interaction.guild, {
        color: config.colors.error,
        title: `${config.emojis.ban} Mitglied gebannt`,
        description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
        userId: target.id,
      });
    } catch (err) {
      logger.error('Ban-Fehler:', err);
      await interaction.reply({
        embeds: [errorEmbed('Der Ban ist fehlgeschlagen. Überprüfe meine Berechtigungen.')],
        flags: ['Ephemeral'],
      });
    }
  },
};
