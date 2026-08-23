'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { baseEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission } = require('../../utils/permissions');
const { fullTimestamp } = require('../../utils/time');
const db = require('../../database');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Zeigt die Verwarnungen eines Mitglieds an')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ModerateMembers)) return;

    const target = interaction.options.getUser('mitglied');
    const warns = db.getWarns(interaction.guild.id, target.id);

    if (!warns.length) {
      return interaction.reply({
        embeds: [baseEmbed({ color: config.colors.success, title: '✅ Keine Verwarnungen', description: `${target.tag} hat keine Verwarnungen.` })],
        flags: ['Ephemeral'],
      });
    }

    const fields = warns.slice(-10).map((w, i) => ({
      name: `Verwarnung #${i + 1} (\`${w.id}\`)`,
      value: `**Grund:** ${w.reason}\n**Moderator:** <@${w.moderatorId}>\n**Datum:** ${fullTimestamp(new Date(w.date))}`,
    }));

    const embed = baseEmbed({
      color: config.colors.warning,
      title: `⚠️ Verwarnungen von ${target.tag}`,
      description: `Insgesamt **${warns.length}** Verwarnung(en).${warns.length > 10 ? ' (Zeige die letzten 10)' : ''}`,
      fields,
    });

    await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
  },
};
