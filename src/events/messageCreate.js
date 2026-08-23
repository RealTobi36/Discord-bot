'use strict';

const { Events, PermissionFlagsBits } = require('discord.js');
const db = require('../database');
const config = require('../../config');
const logger = require('../logger');

// In-Memory Spam-Tracking: Map<userId, { messages: [timestamps], lastContent, duplicateCount }>
const spamTracker = new Map();

// Reguläre Ausdrücke
const INVITE_REGEX = /(discord\.(?:gg|io|me|li)|discord(?:app)?\.com\/invite)\/[\w-]+/i;
const URL_REGEX = /(https?:\/\/[^\s]+)/gi;
const MENTION_REGEX = /<@!?(\d+)>|<@&(\d+)>/g;

// Intervall zur Bereinigung des Trackers (5 Minuten)
setInterval(() => {
  const now = Date.now();
  for (const [userId, data] of spamTracker.entries()) {
    data.messages = data.messages.filter((t) => now - t < 60_000);
    if (data.messages.length === 0 && now - data.lastMessageTime > 120_000) {
      spamTracker.delete(userId);
    }
  }
}, 60_000);

function isImmune(member) {
  if (!member) return true;
  if (member.permissions.has(PermissionFlagsBits.ManageMessages)) return true;
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (member.id === member.guild.ownerId) return true;
  return false;
}

async function takeAction(message, reason, action) {
  const settings = db.getGuild(message.guild.id);

  // Nachricht löschen
  try {
    await message.delete();
  } catch {
    // fehlende Berechtigungen werden ignoriert
  }

  // Nutzer per DM warnen
  try {
    await message.author.send({
      content: `⚠️ Deine Nachricht in **${message.guild.name}** wurde entfernt.\n**Grund:** ${reason}`,
    }).catch(() => {});
  } catch { /* DMs deaktiviert */ }

  // Timeout als Strafe
  try {
    if (message.member && message.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      await message.member.timeout(10 * 60 * 1000, reason);
    }
  } catch { /* Timeout fehlgeschlagen */ }

  // Mod-Log
  try {
    if (settings.modLogChannelId) {
      const channel = await message.guild.channels.fetch(settings.modLogChannelId).catch(() => null);
      if (channel?.isTextBased()) {
        await channel.send({
          embeds: [{
            color: config.colors.warning,
            title: `🛡️ AutoMod: ${action}`,
            description: `**Nutzer:** ${message.author.tag} (\`${message.author.id}\`)\n**Kanal:** ${message.channel}\n**Grund:** ${reason}`,
            fields: message.content ? [{ name: 'Nachricht', value: message.content.slice(0, 1024) || '*leer*' }] : [],
            timestamp: new Date().toISOString(),
          }],
        });
      }
    }
  } catch (err) {
    logger.error('AutoMod-Log fehlgeschlagen:', err);
  }
}

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (!message.guild || message.author.bot) return;

    const automod = db.getAutomod(message.guild.id, config.defaultAutomod);
    if (!automod.enabled) return;

    const member = message.member;
    if (isImmune(member)) return;

    const content = message.content;
    const now = Date.now();

    // ── 1. Wortfilter ──
    if (automod.wordFilter && automod.bannedWords?.length) {
      const lower = content.toLowerCase();
      const hit = automod.bannedWords.find((word) => word && lower.includes(word.toLowerCase()));
      if (hit) {
        await takeAction(message, `Verbotenes Wort: \`${hit}\``, 'Wortfilter');
        return;
      }
    }

    // ── 2. Invite-Link ──
    if (automod.antiInvite && INVITE_REGEX.test(content)) {
      await takeAction(message, 'Discord-Invite-Link erkannt', 'Invite-Filter');
      return;
    }

    // ── 3. Externe Links ──
    if (automod.antiLink && URL_REGEX.test(content)) {
      await takeAction(message, 'Externer Link erkannt', 'Link-Filter');
      return;
    }

    // ── 4. Mention-Spam ──
    if (automod.antiMentionSpam) {
      const mentions = content.match(MENTION_REGEX) || [];
      if (mentions.length >= automod.maxMentions) {
        await takeAction(message, `Zu viele Erwähnungen (${mentions.length}/${automod.maxMentions})`, 'Mention-Spam');
        return;
      }
    }

    // ── 5. Anti-Spam / Duplikate ──
    if (automod.antiSpam) {
      let data = spamTracker.get(message.author.id);
      if (!data) {
        data = { messages: [], lastContent: '', duplicateCount: 0, lastMessageTime: now };
        spamTracker.set(message.author.id, data);
      }

      data.messages.push(now);
      data.messages = data.messages.filter((t) => now - t < automod.spamInterval);
      data.lastMessageTime = now;

      // Duplikat-Check
      if (content === data.lastContent) {
        data.duplicateCount += 1;
      } else {
        data.duplicateCount = 1;
        data.lastContent = content;
      }

      if (data.messages.length >= automod.spamThreshold || data.duplicateCount >= automod.duplicateThreshold) {
        data.messages = [];
        data.duplicateCount = 0;
        data.lastContent = '';
        await takeAction(message, 'Spam erkannt (zu viele/gleiche Nachrichten)', 'Anti-Spam');
      }
    }
  },
};
