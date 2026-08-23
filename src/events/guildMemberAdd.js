'use strict';

const { Events } = require('discord.js');
const db = require('../database');
const config = require('../../config');
const logger = require('../logger');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      // Aktiven Mute wiederherstellen (z.B. wenn der Nutzer den Server verlassen hatte)
      const mute = db.getMute(member.guild.id, member.id);
      if (mute) {
        const settings = db.getGuild(member.guild.id);
        if (settings.muteRoleId) {
          await member.roles.add(settings.muteRoleId, 'Mute bei Wiedereintritt wiederhergestellt').catch(() => {});
        }
      }
    } catch (err) {
      logger.error('Fehler bei GuildMemberAdd:', err);
    }
  },
};
