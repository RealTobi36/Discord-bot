'use strict';

const { Events, ActivityType } = require('discord.js');
const logger = require('../logger');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`════════════════════════════════════════`);
    logger.info(`✅ Eingeloggt als ${client.user.tag}`);
    logger.info(`   Bot-ID: ${client.user.id}`);
    logger.info(`   Server: ${client.guilds.cache.size}`);
    logger.info(`   Commands: ${client.commands.size}`);
    logger.info(`════════════════════════════════════════`);

    client.user.setPresence({
      activities: [{ name: `${client.guilds.cache.size} Server | /help`, type: ActivityType.Watching }],
      status: 'online',
    });
  },
};
