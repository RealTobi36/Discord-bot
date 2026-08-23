'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const db = require('../../database');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('clearwarns')
    .setDescription('Löscht alle Verwarnungen eines Mitglieds')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) return;

    const target = interaction.options.getUser('mitglied');
    const removed = db.clearWarns(interaction.guild.id, target.id);

    if (removed === 0) {
      return interaction.reply({ embeds: [errorEmbed(`${target.tag} hat keine Verwarnungen.`)], flags: ['Ephemeral'] });
    }

    await interaction.reply({ embeds: [successEmbed(`${removed} Verwarnung(en) von **${target.tag}** wurden gelöscht.`, 'Verwarnungen gelöscht')] });

    await logModAction(interaction.guild, {
      color: config.colors.success,
      title: '🧹 Verwarnungen zurückgesetzt',
      description: `**Nutzer:** ${target.tag}\n**Moderator:** ${interaction.user.tag}\n**Anzahl:** ${removed}`,
      userId: target.id,
    });
  },
};
