'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Zeigt den Avatar eines Mitglieds in voller Auflösung')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(false),
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('mitglied') || interaction.user;
    const url = target.displayAvatarURL({ size: 1024, extension: 'png' });

    const embed = baseEmbed({
      color: config.colors.primary,
      title: `🖼️ Avatar von ${target.tag}`,
      description: `[Bild in voller Auflösung](${url})`,
    }).setImage(url);

    await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
  },
};
