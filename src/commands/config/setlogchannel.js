'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission } = require('../../utils/permissions');
const db = require('../../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlogchannel')
    .setDescription('Legt den Kanal fest, in den Moderations-Aktionen geloggt werden')
    .addChannelOption((o) =>
      o.setName('kanal').setDescription('Der Log-Kanal').addChannelTypes(ChannelType.GuildText).setRequired(true),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageGuild)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageWebhooks)) {
      // Wir brauchen nur SendMessages, aber manageWebhooks wird für Embeds nicht gebraucht.
      // Hier lediglich sicherstellen, dass wir schreiben dürfen:
    }

    const channel = interaction.options.getChannel('kanal');
    db.setGuildSetting(interaction.guild.id, 'modLogChannelId', channel.id);

    await interaction.reply({
      embeds: [successEmbed(`Der Mod-Log-Kanal wurde auf ${channel} gesetzt. Test-Eintrag folgt...`, '📝 Log-Kanal gesetzt')],
    });

    try {
      await channel.send({
        embeds: [successEmbed('Dieser Kanal ist nun der Mod-Log-Kanal. Alle Moderations-Aktionen werden hier protokolliert.', '📝 Mod-Log aktiviert')],
      });
    } catch {
      await interaction.followUp({
        embeds: [errorEmbed(`Ich kann in ${channel} keine Nachrichten senden. Bitte überprüfe meine Berechtigungen.`)],
        flags: ['Ephemeral'],
      });
    }
  },
};
