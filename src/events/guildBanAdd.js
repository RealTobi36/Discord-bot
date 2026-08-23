'use strict';

const { Events, AuditLogEvent } = require('discord.js');
const db = require('../database');
const logger = require('../logger');

// Trackt externe Moderations-Aktionen (z.B. Bans über Discord UI) und loggt sie.
module.exports = {
  name: Events.GuildBanAdd,
  async execute(ban) {
    try {
      const settings = db.getGuild(ban.guild.id);
      if (!settings.modLogChannelId) return;

      // Moderator aus Audit-Log ermitteln
      let executor = 'Unbekannt';
      try {
        const logs = await ban.guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 });
        const entry = logs.entries.first();
        if (entry && entry.target.id === ban.user.id && Date.now() - entry.createdTimestamp < 5000) {
          executor = entry.executor.tag;
        }
      } catch { /* fehlende Berechtigung */ }

      const channel = await ban.guild.channels.fetch(settings.modLogChannelId).catch(() => null);
      if (!channel?.isTextBased()) return;

      await channel.send({
        embeds: [{
          color: config.colors.error,
          title: '🔨 Mitglied gebannt',
          description: `**Nutzer:** ${ban.user.tag} (\`${ban.user.id}\`)\n**Moderator:** ${executor}\n**Grund:** ${ban.reason || 'Kein Grund angegeben'}`,
          timestamp: new Date().toISOString(),
        }],
      });
    } catch (err) {
      logger.error('GuildBanAdd Log fehlgeschlagen:', err);
    }
  },
};
