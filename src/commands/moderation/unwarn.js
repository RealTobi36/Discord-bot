'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const db = require('../../database');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unwarn')
    .setDescription('Entfernt eine bestimmte Verwarnung anhand der Warn-ID')
    .addStringOption((o) =>
      o.setName('warn-id').setDescription('Die ID der Verwarnung (aus /warnings)').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) return;

    const warnId = interaction.options.getString('warn-id');
    const removed = db.removeWarn(interaction.guild.id, warnId);

    if (!removed) {
      return interaction.reply({ embeds: [errorEmbed('Keine Verwarnung mit dieser ID gefunden.')], flags: ['Ephemeral'] });
    }

    await interaction.reply({ embeds: [successEmbed(`Verwarnung \`${warnId}\` wurde entfernt.`, 'Verwarnung entfernt')] });

    await logModAction(interaction.guild, {
      color: config.colors.success,
      title: '🔄 Verwarnung entfernt',
      description: `**Moderator:** ${interaction.user.tag}\n**Warn-ID:** \`${warnId}\``,
    });
  },
};
