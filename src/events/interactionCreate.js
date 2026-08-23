'use strict';

const { Events, InteractionType } = require('discord.js');
const logger = require('../logger');
const { errorEmbed } = require('../utils/embeds');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction, client) {
    // ── Slash Commands ──
    if (interaction.type === InteractionType.ApplicationCommand) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction, client);
      } catch (err) {
        logger.error(`Fehler im Command /${interaction.commandName}:`, err);
        const embed = errorEmbed('Beim Ausführen des Befehls ist ein Fehler aufgetreten. Die Entwickler:innen wurden informiert.', 'Befehlsfehler');
        if (interaction.deferred || interaction.replied) {
          interaction.editReply({ embeds: [embed] }).catch(() => {});
        } else {
          interaction.reply({ embeds: [embed], flags: ['Ephemeral'] }).catch(() => {});
        }
      }
    }

    // ── Autocomplete ──
    if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {
      const command = client.commands.get(interaction.commandName);
      if (!command || !command.autocomplete) return;
      try {
        await command.autocomplete(interaction, client);
      } catch (err) {
        logger.error(`Fehler im Autocomplete /${interaction.commandName}:`, err);
      }
    }
  },
};
