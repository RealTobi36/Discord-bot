'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Entsperrt einen zuvor gesperrten Kanal')
    .addChannelOption((o) =>
      o.setName('kanal').setDescription('Kanal (Standard: aktueller Kanal)').addChannelTypes(ChannelType.GuildText),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageChannels)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageChannels)) return;

    const channel = interaction.options.getChannel('kanal') || interaction.channel;
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

    try {
      await channel.permissionOverwrites.edit(interaction.guild.id, {
        SendMessages: null,
        AddReactions: null,
        CreatePublicThreads: null,
        CreatePrivateThreads: null,
        SendMessagesInThreads: null,
      }, { reason: `Kanal entsperrt: ${reason} (by ${interaction.user.tag})` });

      await interaction.reply({ embeds: [successEmbed(`Der Kanal ${channel} wurde entsperrt.\n**Grund:** ${reason}`, '🔓 Kanal entsperrt')] });

      await logModAction(interaction.guild, {
        color: config.colors.success,
        title: '🔓 Kanal entsperrt',
        description: `**Kanal:** ${channel}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
      });
    } catch (err) {
      logger.error('Unlock-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Der Kanal konnte nicht entsperrt werden.')], flags: ['Ephemeral'] });
    }
  },
};
