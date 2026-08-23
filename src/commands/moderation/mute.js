'use strict';

const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { successEmbed, errorEmbed } = require('../../utils/embeds');
const { hasPermission, botHasPermission, canTargetMember } = require('../../utils/permissions');
const { logModAction } = require('../../utils/modLog');
const { parseDuration, formatDuration, relativeTimestamp } = require('../../utils/time');
const db = require('../../database');
const config = require('../../../config');
const logger = require('../../logger');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Schaltet ein Mitglied mit der Mute-Rolle stumm (permanent oder temporär)')
    .addUserOption((o) =>
      o.setName('mitglied').setDescription('Das Mitglied').setRequired(true),
    )
    .addStringOption((o) =>
      o.setName('dauer').setDescription('z.B. 30m, 6h, 7d (leer = permanent)').setRequired(false),
    )
    .addStringOption((o) =>
      o.setName('grund').setDescription('Grund').setRequired(false),
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    .setDMPermission(false),

  async execute(interaction) {
    if (!hasPermission(interaction, PermissionFlagsBits.ManageRoles)) return;
    if (!botHasPermission(interaction, PermissionFlagsBits.ManageRoles)) return;

    const target = interaction.options.getMember('mitglied');
    const durationInput = interaction.options.getString('dauer');
    const reason = interaction.options.getString('grund') || 'Kein Grund angegeben';

    const settings = db.getGuild(interaction.guild.id);
    if (!settings.muteRoleId) {
      return interaction.reply({
        embeds: [errorEmbed('Es ist keine Mute-Rolle konfiguriert. Nutze `/setmuterole`, um eine festzulegen.')],
        flags: ['Ephemeral'],
      });
    }

    let ms = null;
    if (durationInput) {
      ms = parseDuration(durationInput);
      if (!ms || ms <= 0) {
        return interaction.reply({
          embeds: [errorEmbed('Ungültige Dauer. Nutze z.B. `30m`, `6h`, `7d`.')],
          flags: ['Ephemeral'],
        });
      }
    }

    if (!target) return interaction.reply({ embeds: [errorEmbed('Mitglied nicht gefunden.')], flags: ['Ephemeral'] });
    if (!canTargetMember(interaction, target)) return;

    try {
      const muteRole = await interaction.guild.roles.fetch(settings.muteRoleId).catch(() => null);
      if (!muteRole) {
        return interaction.reply({ embeds: [errorEmbed('Die konfigurierte Mute-Rolle existiert nicht mehr. Bitte setze sie neu.')], flags: ['Ephemeral'] });
      }

      await target.roles.add(muteRole, `${reason} (by ${interaction.user.tag})`);

      const expiresAt = ms ? Date.now() + ms : null;
      db.addMute(interaction.guild.id, target.id, expiresAt, interaction.user.id, reason);

      const dauerText = ms ? formatDuration(ms) : 'Permanent';
      const endText = ms ? ` (endet ${relativeTimestamp(new Date(expiresAt))})` : '';

      await interaction.reply({
        embeds: [successEmbed(`**${target.user.tag}** wurde stummgeschaltet für **${dauerText}**${endText}.\n**Grund:** ${reason}`)],
      });

      await logModAction(interaction.guild, {
        color: config.colors.muted,
        title: '🔇 Mitglied stummgeschaltet',
        description: `**Nutzer:** ${target.user.tag}\n**Moderator:** ${interaction.user.tag}\n**Dauer:** ${dauerText}${ms ? `\n**Endet:** ${relativeTimestamp(new Date(expiresAt))}` : ''}\n**Grund:** ${reason}`,
        userId: target.id,
      });
    } catch (err) {
      logger.error('Mute-Fehler:', err);
      await interaction.reply({ embeds: [errorEmbed('Das Stummschalten ist fehlgeschlagen.')], flags: ['Ephemeral'] });
    }
  },
};
