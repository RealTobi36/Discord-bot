'use strict';
require('dotenv').config();

const config = {
  token: process.env.DISCORD_TOKEN,
  clientId: process.env.CLIENT_ID,
  guildId: process.env.GUILD_ID || null,

  // Default command prefix (für Prefix-Commands / Erwähnung)
  prefix: '!',

  // Embed-Farben
  colors: {
    primary: 0x5865f2,   // Discord Blurple
    success: 0x2ecc71,
    error: 0xe74c3c,
    warning: 0xf1c40f,
    info: 0x3498db,
    muted: 0x95a5a6,
  },

  // Emojis (können angepasst werden)
  emojis: {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    ban: '🔨',
    kick: '👢',
    mute: '🔇',
    warn: '⚠️',
    purge: '🧹',
    lock: '🔒',
    unlock: '🔓',
    slowmode: '🐌',
    nuke: '💥',
    info: 'ℹ️',
  },

  // Standard-AutoMod-Einstellungen pro Guild
  defaultAutomod: {
    enabled: false,
    antiSpam: true,
    antiInvite: true,
    antiLink: false,
    antiMentionSpam: true,
    wordFilter: true,
    bannedWords: [],
    maxMentions: 5,
    spamThreshold: 5,
    spamInterval: 5000,
    duplicateThreshold: 4, // gleiche Nachricht
  },
};

module.exports = config;
