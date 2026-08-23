'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lock')
    .setDescription('Sperrt einen Kanal (jeder außer Moderatoren darf nicht mehr schreiben)')
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
        SendMessages: false,
        AddReactions: false,
        CreatePublicThreads: false,
        CreatePrivateThreads: false,
        SendMessagesInThreads: false,
      }, { reason: `Kanal gesperrt: ${reason} (by ${interaction.user.tag})` });

      await channel.permissionOverwrites.edit(interaction.guild.members.me, {
        SendMessages: true,
      });

      await interaction.reply({ embeds: [successEmbed(`Der Kanal ${channel} wurde gesperrt.\n**Grund:** ${reason}`, '🔒 Kanal gesperrt')] });

      await logModAction(interaction.guild, {
        color: config.colors.warning,
        title: '🔒 Kanal gesperrt',
        description: `**Kanal:** ${channel}\n**Moderator:** ${interaction.user.tag}\n**Grund:** ${reason}`,
      });
    } catch (err) {
      logger.error('Lock-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Der Kanal konnte nicht gesperrt werden.')], flags: ['Ephemeral'] });
    }
  },
};
