'use strict';

const { Client, GatewayIntentBits, Collection, Partials, ActivityType } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');
const config = require('./config');
const logger = require('./src/logger');
const db = require('./src/database');

// ── Intents ──────────────────────────────────────────────────
// Wir brauchen mehrere Intents für Moderations-Features.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent, // für AutoMod / Spam-Erkennung
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
  presence: {
    activities: [{ name: 'über den Server', type: ActivityType.Watching }],
    status: 'online',
  },
});

// ── Commands laden ───────────────────────────────────────────
client.commands = new Collection();

function loadCommands(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      loadCommands(full);
    } else if (item.name.endsWith('.js')) {
      const command = require(full);
      if (command?.data && command?.execute) {
        client.commands.set(command.data.name, command);
        logger.debug(`Command geladen: ${command.data.name}`);
      }
    }
  }
}

// ── Events laden ─────────────────────────────────────────────
function loadEvents(dir) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      loadEvents(full);
    } else if (item.name.endsWith('.js')) {
      const event = require(full);
      if (event?.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        logger.debug(`Event geladen: ${event.name}`);
      }
    }
  }
}

// ── Auto-Unmute Scheduler ────────────────────────────────────
// Prüft alle 30 Sekunden auf abgelaufene Mutes (Role-based Mutes).
function startMuteScheduler() {
  setInterval(async () => {
    const expired = db.getExpiredMutes();
    for (const entry of expired) {
      try {
        const guild = await client.guilds.fetch(entry.guildId).catch(() => null);
        if (!guild) continue;

        const settings = db.getGuild(guild.id);
        if (!settings.muteRoleId) {
          db.removeMute(guild.id, entry.userId);
          continue;
        }

        const member = await guild.members.fetch(entry.userId).catch(() => null);
        if (member) {
          await member.roles.remove(settings.muteRoleId, 'Mute abgelaufen').catch(() => {});
          logger.info(`Mute abgelaufen für ${member.user.tag} in ${guild.name}`);
        }
        db.removeMute(guild.id, entry.userId);
      } catch (err) {
        logger.error('Fehler beim Auto-Unmute:', err);
      }
    }
  }, 30_000);
}

// ── Fehlerbehandlung ─────────────────────────────────────────
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
});

// ── Start ────────────────────────────────────────────────────
(async () => {
  if (!config.token) {
    logger.error('DISCORD_TOKEN ist nicht gesetzt. Kopiere .env.example zu .env und trage deinen Token ein.');
    process.exit(1);
  }

  loadCommands(path.join(__dirname, 'src', 'commands'));
  loadEvents(path.join(__dirname, 'src', 'events'));
  startMuteScheduler();

  await client.login(config.token);
})();

module.exports = client;
