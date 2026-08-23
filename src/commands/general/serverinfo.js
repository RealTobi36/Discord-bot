'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const { fullTimestamp } = require('../../utils/time');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Zeigt Informationen über den Server an'),

  async execute(interaction) {
    const { guild } = interaction;
    const owner = await guild.fetchOwner();

    const embed = baseEmbed({
      color: config.colors.primary,
      title: `${guild.name}`,
      thumbnail: guild.iconURL({ size: 256 }),
      fields: [
        { name: '🆔 Server-ID', value: `\`${guild.id}\``, inline: true },
        { name: '👑 Besitzer', value: `${owner.user.tag}`, inline: true },
        { name: '🌍 Region', value: guild.preferredLocale || 'Automatisch', inline: true },
        { name: '👥 Mitglieder', value: `${guild.memberCount}`, inline: true },
        { name: '💬 Kanäle', value: `${guild.channels.cache.size}`, inline: true },
        { name: '🎭 Rollen', value: `${guild.roles.cache.size}`, inline: true },
        { name: '😀 Emojis', value: `${guild.emojis.cache.size}`, inline: true },
        { name: '🚀 Boosts', value: `${guild.premiumSubscriptionCount || 0} (Level ${guild.premiumTier})`, inline: true },
        { name: '📅 Erstellt am', value: fullTimestamp(guild.createdAt) },
      ],
    });

    if (guild.bannerURL()) embed.setImage(guild.bannerURL({ size: 1024 }));

    await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
  },
};
