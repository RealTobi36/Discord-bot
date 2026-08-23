'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const db = require('../../database');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Hebt die Stummschaltung (Mute-Rolle) eines Mitglieds auf')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageRoles)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageRoles)) return;

    const target = interaction.options.getMember('mitglied');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';
    const settings = db.getGuild(interaction.guild.id);

    if (!target) return interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], flags: ['Ephemeral'] });
    if (!canTargetMember(interaction, target)) return;

    if (!settings.muteRoleId || !target.roles.cache.has(settings.muteRoleId)) {
      return interaction.reply({ embeds: [errorEmbed('Dieses Mitglied ist nicht stummgeschaltet.')], flags: ['Ephemeral'] });
    }

    try {
      const muteRole = await interaction.guild.roles.fetch(settings.muteRoleId);
      await target.roles.remove(muteRole, `${reason} (by ${interaction.user.tag})`);
      db.removeMute(interaction.guild.id, target.id);

      await interaction.reply({ embeds: [successEmbed(`**${target.user.tag}** wurde wieder entsperrt.`)] });

      await logModAction(interaction.guild, {
        color: config.colors.success,
        title: '🔊 Mitglied entsperrt',
        description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
        userId: target.id,
      });
    } catch (err) {
      logger.error('Unmute-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Aufhebung fehlgeschlagen.')], flags: ['Ephemeral'] });
    }
  },
};
