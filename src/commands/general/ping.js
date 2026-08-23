'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Zeigt die Latenz des Bots an'),

  async execute(interaction, client) {
    const sent = await interaction.reply({ content: 'Pinging...', fetchReply: true });
    const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;

    const embed = baseEmbed({
      color: config.colors.success,
      title: '🏓 Pong!',
      fields: [
        { name: '📡 Bot-Latenz', value: `\`${roundtrip}ms\``, inline: true },
        { name: '🌐 WebSocket', value: `\`${Math.round(client.ws.ping)}ms\``, inline: true },
        { name: '📶 Uptime', value: `\`${Math.round(client.uptime / 60000)} Min.\``, inline: true },
      ],
    });

    await interaction.editReply({ content: null, embeds: [embed] });
  },
};
