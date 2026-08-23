'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const { fullTimestamp } = require('../../utils/time');
const db = require('../../database');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Zeigt Informationen über ein Mitglied an')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied, das angezeigt werden soll').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getMember('mitglied') || interaction.member;
    const warns = db.getWarns(interaction.guild.id, target.id);

    const roles = target.roles.cache
      .filter((r) => r.id !== interaction.guild.id)
      .sort((a, b) => b.position - a.position)
      .map((r => r.toString()))
      .slice(0, 15);

    const embed = baseEmbed({
      color: target.displayHexColor || config.colors.primary,
      title: `${target.user.tag}`,
      thumbnail: target.user.displayAvatarURL({ size: 256 }),
      fields: [
        { name: '🆔 User-ID', value: `\`${target.id}\``, inline: true },
        { name: '🤖 Bot?', value: target.user.bot ? 'Ja' : 'Nein', inline: true },
        { name: '⚠️ Verwarnungen', value: `${warns.length}`, inline: true },
        { name: '📅 Account erstellt', value: fullTimestamp(target.user.createdAt) },
        { name: '📥 Server beitritt', value: fullTimestamp(target.joinedAt) },
        {
          name: `🎭 Rollen (${target.roles.cache.size - 1})`,
          value: roles.length ? roles.join(', ') : 'Keine Rollen',
        },
      ],
    });

    if (target.communicationDisabledUntil && target.communicationDisabledUntil > new Date()) {
      embed.addFields({
        name: '🔇 Timeout bis',
        value: fullTimestamp(target.communicationDisabledUntil),
        inline: true,
      });
    }

    await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
  },
};
