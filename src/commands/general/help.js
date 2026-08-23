'use strict';

const { SlashCommandBuilder } = require('discord.js');
const { baseEmbed } = require('../../utils/embeds');
const config = require('../../../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Zeigt alle verfügbaren Befehle und Hilfe an'),

  async execute(interaction) {
    const embed = baseEmbed({
      color: config.colors.primary,
      title: '📚 Hilfe – Discord Mod Bot',
      description: 'Hier ist eine Übersicht aller verfügbaren Befehle. Alle Befehle sind Slash-Commands (`/`).',
    });

    embed.addFields(
      {
        name: '🛡️ Moderation',
        value: [
          '`/ban` – Mitglied bannen',
          '`/kick` – Mitglied kicken',
          '`/unban` – Ban aufheben',
          '`/timeout` – Mitglied temporär stummschalten',
          '`/mute` – Mitglied mit Rolle stummschalten',
          '`/unmute` – Mute aufheben',
          '`/warn` – Verwarnung aussprechen',
          '`/warnings` – Verwarnungen anzeigen',
          '`/unwarn` – Verwarnung entfernen',
          '`/clearwarns` – Alle Verwarnungen löschen',
          '`/clear` – Nachrichten löschen',
          '`/nuke` – Kanal zurücksetzen (klonen)',
          '`/lock` – Kanal sperren',
          '`/unlock` – Kanal entsperren',
          '`/slowmode` – Slowmode setzen',
        ].join('\n'),
      },
      {
        name: '⚙️ Einstellungen',
        value: [
          '`/setlogchannel` – Mod-Log-Kanal festlegen',
          '`/setmuterole` – Mute-Rolle festlegen',
          '`/automod` – AutoMod konfigurieren',
        ].join('\n'),
      },
      {
        name: 'ℹ️ Info',
        value: [
          '`/help` – Diese Übersicht',
          '`/ping` – Bot-Latenz anzeigen',
          '`/serverinfo` – Server-Informationen',
          '`/userinfo` – Mitglieder-Informationen',
          '`/avatar` – Avatar eines Mitglieds anzeigen',
        ].join('\n'),
      },
      {
        name: '🔗 Setup',
        value: '1. Erstelle eine Anwendung auf dem [Discord Developer Portal](https://discord.com/developers/applications).\n2. Setze Token & Client-ID in die `.env`.\n3. Führe `npm run deploy` aus.\n4. Starte den Bot mit `npm start`.',
      },
    );

    embed.setFooter({ text: 'Discord Mod Bot • Made with discord.js' });

    await interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
  },
};
