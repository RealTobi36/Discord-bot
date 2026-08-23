'use strict';

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { successEmbed, errorEmbed, baseEmbed } = require('../../utils/embeds');
const { hasPermission } = require('../../utils/permissions');
const db = require('../../database');
const config = require('../../../config');

const TOGGLE_OPTIONS = [
  { name: 'spam-schutz', key: 'antiSpam' },
  { name: 'invite-schutz', key: 'antiInvite' },
  { name: 'link-schutz', key: 'antiLink' },
  { name: 'mention-schutz', key: 'antiMentionSpam' },
  { name: 'wortfilter', key: 'wordFilter' },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('automod')
    .setDescription('Konfiguriert das automatische Moderations-System')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDMPermission(false)

    .addSubcommand((s) =>
      s.setName('status').setDescription('Zeigt die aktuelle AutoMod-Konfiguration an'),
    )
    .addSubcommand((s) =>
      s.setName('toggle')
        .setDescription('Aktiviert oder deaktiviert den AutoMod komplett')
        .addBooleanOption((o) => o.setName('aktiv').setDescription('Aktiv?').setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName('schutz')
        .setDescription('Aktiviert/deaktiviert einzelne Schutzmaßnahmen')
        .addStringOption((o) =>
          o.setName('art').setDescription('Welche Schutzmaßnahme?').setRequired(true)
            .addChoices(...TOGGLE_OPTIONS.map((t) => ({ name: t.name, value: t.key }))),
        )
        .addBooleanOption((o) => o.setName('aktiv').setDescription('Aktiv?').setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName('spam-einstellungen')
        .setDescription('Konfiguriert die Spam-Erkennung')
        .addIntegerOption((o) => o.setName('schwelle').setDescription('Anzahl Nachrichten im Intervall (3-20)').setMinValue(3).setMaxValue(20).setRequired(false))
        .addIntegerOption((o) => o.setName('intervall').setDescription('Intervall in Sekunden (2-30)').setMinValue(2).setMaxValue(30).setRequired(false))
        .addIntegerOption((o) => o.setName('duplikate').setDescription('Max. gleiche Nachrichten (2-10)').setMinValue(2).setMaxValue(10).setRequired(false)),
    )
    .addSubcommand((s) =>
      s.setName('max-mentions')
        .setDescription('Maximale Anzahl an Erwähnungen pro Nachricht')
        .addIntegerOption((o) => o.setName('anzahl').setDescription('3-50').setMinValue(3).setMaxValue(50).setRequired(true)),
    )
    .addSubcommand((s) =>
      s.setName('woerter')
        .setDescription('Fügt verbotene Wörter hinzu oder entfernt sie')
        .addStringOption((o) =>
          o.setName('aktion').setDescription('Hinzufügen oder entfernen?').setRequired(true)
            .addChoices({ name: 'hinzufügen', value: 'add' }, { name: 'entfernen', value: 'remove' }, { name: 'liste', value: 'list' }),
        )
        .addStringOption((o) => o.setName('wort').setDescription('Das Wort (nicht bei "liste")').setRequired(false)),
    )
    .addSubcommand((s) =>
      s.setName('zuruecksetzen').setDescription('Setzt alle AutoMod-Einstellungen auf die Standardwerte zurück'),
    ),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageGuild)) return;

    const sub = interaction.options.getSubcommand();
    const automod = db.getAutomod(interaction.guild.id, config.defaultAutomod);

    // ── Status ──
    if (sub === 'status') {
      const embed = baseEmbed({
        color: automod.enabled ? config.colors.success : config.colors.muted,
        title: '🛡️ AutoMod-Konfiguration',
        description: automod.enabled ? 'AutoMod ist **aktiviert** ✅' : 'AutoMod ist **deaktiviert** ❌',
        fields: [
          { name: '📨 Anti-Spam', value: automod.antiSpam ? '✅' : '❌', inline: true },
          { name: '🔗 Invite-Filter', value: automod.antiInvite ? '✅' : '❌', inline: true },
          { name: '🌐 Link-Filter', value: automod.antiLink ? '✅' : '❌', inline: true },
          { name: '📣 Mention-Schutz', value: automod.antiMentionSpam ? '✅' : '❌', inline: true },
          { name: '🔤 Wortfilter', value: automod.wordFilter ? '✅' : '❌', inline: true },
          { name: '⚙️ Spam-Schwelle', value: `${automod.spamThreshold} / ${automod.spamInterval / 1000}s`, inline: true },
          { name: '🔁 Duplikate', value: `${automod.duplicateThreshold}`, inline: true },
          { name: '📣 Max. Mentions', value: `${automod.maxMentions}`, inline: true },
          { name: '🚫 Verbotene Wörter', value: automod.bannedWords.length ? automod.bannedWords.map((w) => `\`${w}\``).join(', ') : 'Keine' },
        ],
      });
      return interaction.reply({ embeds: [embed], flags: ['Ephemeral'] });
    }

    // ── Toggle komplett ──
    if (sub === 'toggle') {
      automod.enabled = interaction.options.getBoolean('aktiv');
      db.setAutomod(interaction.guild.id, automod);
      return interaction.reply({
        embeds: [successEmbed(`AutoMod ist jetzt **${automod.enabled ? 'aktiviert' : 'deaktiviert'}**.`, '🛡️ AutoMod')],
      });
    }

    // ── Einzelne Schutzmaßnahmen ──
    if (sub === 'schutz') {
      const key = interaction.options.getString('art');
      const active = interaction.options.getBoolean('aktiv');
      automod[key] = active;
      db.setAutomod(interaction.guild.id, automod);
      const label = TOGGLE_OPTIONS.find((t) => t.key === key)?.name || key;
      return interaction.reply({ embeds: [successEmbed(`**${label}** ist jetzt ${active ? '✅ aktiviert' : '❌ deaktiviert'}.`, '🛡️ Schutz aktualisiert')] });
    }

    // ── Spam-Einstellungen ──
    if (sub === 'spam-einstellungen') {
      const schwelle = interaction.options.getInteger('schwelle');
      const intervall = interaction.options.getInteger('intervall');
      const duplikate = interaction.options.getInteger('duplikate');

      if (schwelle) automod.spamThreshold = schwelle;
      if (intervall) automod.spamInterval = intervall * 1000;
      if (duplikate) automod.duplicateThreshold = duplikate;

      db.setAutomod(interaction.guild.id, automod);
      return interaction.reply({
        embeds: [successEmbed(
          `Spam-Einstellungen aktualisiert:\n• Schwelle: **${automod.spamThreshold}** Nachrichten\n• Intervall: **${automod.spamInterval / 1000}s**\n• Duplikate: **${automod.duplicateThreshold}**`,
          '⚙️ Spam-Konfiguration',
        )],
      });
    }

    // ── Max Mentions ──
    if (sub === 'max-mentions') {
      automod.maxMentions = interaction.options.getInteger('anzahl');
      db.setAutomod(interaction.guild.id, automod);
      return interaction.reply({ embeds: [successEmbed(`Maximale Erwähnungen pro Nachricht auf **${automod.maxMentions}** gesetzt.`)] });
    }

    // ── Wörter ──
    if (sub === 'woerter') {
      const action = interaction.options.getString('aktion');
      const word = interaction.options.getString('wort');

      if (action === 'list') {
        return interaction.reply({
          embeds: [baseEmbed({
            color: config.colors.info,
            title: '🚫 Verbotene Wörter',
            description: automod.bannedWords.length ? automod.bannedWords.map((w) => `• \`${w}\``).join('\n') : 'Keine verbotenen Wörter konfiguriert.',
          })],
          flags: ['Ephemeral'],
        });
      }

      if (!word) {
        return interaction.reply({ embeds: [errorEmbed('Bitte gib ein Wort an.')], flags: ['Ephemeral'] });
      }

      if (action === 'add') {
        if (automod.bannedWords.includes(word.toLowerCase())) {
          return interaction.reply({ embeds: [errorEmbed(`\`${word}\` ist bereits verboten.`)], flags: ['Ephemeral'] });
        }
        automod.bannedWords.push(word.toLowerCase());
        db.setAutomod(interaction.guild.id, automod);
        return interaction.reply({ embeds: [successEmbed(`\`${word}\` zur Verbotsliste hinzugefügt.`, '🔤 Wortfilter')] });
      }

      if (action === 'remove') {
        const before = automod.bannedWords.length;
        automod.bannedWords = automod.bannedWords.filter((w) => w !== word.toLowerCase());
        if (automod.bannedWords.length === before) {
          return interaction.reply({ embeds: [errorEmbed(`\`${word}\` wurde nicht gefunden.`)], flags: ['Ephemeral'] });
        }
        db.setAutomod(interaction.guild.id, automod);
        return interaction.reply({ embeds: [successEmbed(`\`${word}\` wurde entfernt.`, '🔤 Wortfilter')] });
      }
    }

    // ── Zurücksetzen ──
    if (sub === 'zuruecksetzen') {
      db.setAutomod(interaction.guild.id, { ...config.defaultAutomod });
      return interaction.reply({ embeds: [successEmbed('Alle AutoMod-Einstellungen wurden auf die Standardwerte zurückgesetzt.', '🔄 Zurückgesetzt')] });
    }
  },
};
