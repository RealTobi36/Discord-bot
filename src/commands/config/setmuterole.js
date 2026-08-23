'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const db = require('../../database');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmuterole')
    .setDescription('Legt die Rolle fest, die stummgeschaltete Mitglieder erhalten')
    .addRoleOption((o) =>
      o.setName('rolle').setDescription('Die Mute-Rolle').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageGuild)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageRoles)) return;

    const role = interaction.options.getRole('rolle');
    const me = interaction.guild.members.me;

    if (role.position >= me.roles.highest.position) {
      return interaction.reply({
        embeds: [errorEmbed('Diese Rolle ist höher oder gleich meiner höchsten Rolle. Ich kann sie nicht vergeben. Verschiebe meine Rolle nach oben.')],
        flags: ['Ephemeral'],
      });
    }

    db.setGuildSetting(interaction.guild.id, 'muteRoleId', role.id);

    await interaction.reply({
      embeds: [successEmbed(`Die Mute-Rolle wurde auf **${role.name}** gesetzt.\n💡 Tipp: Stelle sicher, dass die Rolle in allen Kanälen keine Schreib-Berechtigungen hat.`, '🔇 Mute-Rolle gesetzt')],
    });

    logger.info(`Mute-Rolle in ${interaction.guild.name} auf ${role.name} gesetzt`);
  },
};
