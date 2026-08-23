'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const db = require('../../database');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Spricht einem Mitglied eine Verwarnung aus')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund der Verwarnung').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) return;

    const target = interaction.options.getMember('mitglied');
    const reason = interaction.options.getString('grund');

    if (!target) return interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], flags: ['Ephemeral'] });
    if (!canTargetMember(interaction, target)) return;

    const entry = db.addWarn(interaction.guild.id, target.id, interaction.user.id, reason);
    const totalWarns = db.getWarns(interaction.guild.id, target.id).length;

    try {
      await target.send({
        embeds: [{
          color: config.colors.warning,
          title: '⚠️ Du hast eine Verwarnung erhalten',
          description: `**Server:** ${interaction.guild.name}\n**Grund:** ${reason}\n**Insgesamt:** ${totalWarns} Verwarnung(en)`,
          timestamp: new Date().toISOString(),
        }],
      }).catch(() => {});
    } catch { /* DMs deaktiviert */ }

    await interaction.reply({
      embeds: [successEmbed(`**${target.user.tag}** wurde verwarnt.\n**Grund:** ${reason}\n**Insgesamt:** ${totalWarns} Verwarnung(en)`, 'Verwarnung ausgesprochen')],
    });

    await logModAction(interaction.guild, {
      color: config.colors.warning,
      title: '⚠️ Mitglied verwarnt',
      description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}\n**Warn-ID:** \`${entry.id}\`\n**Insgesamt:** ${totalWarns}`,
      userId: target.id,
    });
  },
};
