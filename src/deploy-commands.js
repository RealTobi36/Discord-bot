'use strict';

const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const logger = require('./logger');

if (!config.token || !config.clientId) {
  logger.error('DISCORD_TOKEN und CLIENT_ID müssen in der .env gesetzt sein.');
  process.exit(1);
}

// Lade alle Command-Dateien rekursiv
function loadCommands(dir) {
  const commands = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      commands.push(...loadCommands(full));
    } else if (item.name.endsWith('.js')) {
      const command = require(full);
      if (command?.data) {
        commands.push(command.data.toJSON());
        logger.debug(`Command geladen: ${command.data.name}`);
      }
    }
  }
  return commands;
}

const commands = loadCommands(path.join(__dirname, 'commands'));

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    logger.info(`Registriere ${commands.length} Slash-Commands...`);

    let data;
    if (config.guildId) {
      // Guild-Commands: sofort verfügbar (gut für Entwicklung)
      data = await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands },
      );
      logger.info(`✅ ${data.length} Guild-Commands registriert (Guild ${config.guildId})`);
    } else {
      // Globale Commands: kann bis zu 1 Stunde dauern
      data = await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands },
      );
      logger.info(`✅ ${data.length} globale Commands registriert (kann bis zu 1h dauern)`);
    }
  } catch (err) {
    logger.error('Fehler beim Registrieren der Commands:', err);
    process.exit(1);
  }
})();
