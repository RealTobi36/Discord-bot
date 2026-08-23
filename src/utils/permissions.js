'use strict';

const { PermissionFlagsBits } = require('discord.js');
const { errorEmbed } = require('./embeds');

/**
 * Prüft, ob der ausführende Member die nötigen Berechtigungen hat.
 * Sendet eine Fehlermeldung und gibt false zurück, falls nicht.
 */
function hasPermission(interaction, permission) {
  if (!interaction.memberPermissions?.has(permission)) {
    interaction.reply({
      embeds: [errorEmbed(`Du benötigst die Berechtigung **${permName(permission)}**, um diesen Befehl auszuführen.`, 'Fehlende Berechtigung')],
      flags: ['Ephemeral'],
    });
    return false;
  }
  return true;
}

/**
 * Prüft, ob das Bot-Mitglied die nötigen Berechtigungen hat.
 */
function botHasPermission(interaction, permission) {
  const me = interaction.guild.members.me;
  if (!me.permissions.has(permission)) {
    interaction.reply({
      embeds: [errorEmbed(`Ich benötige die Berechtigung **${permName(permission)}**, um diese Aktion auszuführen. Bitte überprüfe meine Rollen-Berechtigungen.`, 'Fehlende Bot-Berechtigung')],
      flags: ['Ephemeral'],
    });
    return false;
  }
  return true;
}

/**
 * Hierarchie-Check: Der Moderator darf nur Mitglieder unter seiner eigenen
 * und unter der Bot-Rollenposition moderieren.
 */
function canTargetMember(interaction, target) {
  const moderator = interaction.member;
  const me = interaction.guild.members.me;

  if (target.id === interaction.guild.ownerId) {
    interaction.reply({
      embeds: [errorEmbed('Der Serverbesitzer kann nicht moderiert werden.', 'Aktion nicht möglich')],
      flags: ['Ephemeral'],
    });
    return false;
  }

  if (target.roles.highest.position >= moderator.roles.highest.position && target.id !== moderator.id) {
    interaction.reply({
      embeds: [errorEmbed('Du kannst keine Mitglieder moderieren, die eine gleich- oder höherrangige Rolle haben als du.', 'Rollen-Hierarchie')],
      flags: ['Ephemeral'],
    });
    return false;
  }

  if (target.roles.highest.position >= me.roles.highest.position) {
    interaction.reply({
      embeds: [errorEmbed('Ich kann dieses Mitglied nicht moderieren, da seine höchste Rolle gleich oder höher als meine ist. Verschiebe meine Rolle nach oben.', 'Rollen-Hierarchie')],
      flags: ['Ephemeral'],
    });
    return false;
  }

  return true;
}

function permName(flag) {
  const names = {
    [PermissionFlagsBits.BanMembers]: 'Mitglieder bannen',
    [PermissionFlagsBits.KickMembers]: 'Mitglieder kicken',
    [PermissionFlagsBits.ModerateMembers]: 'Mitglieder im Timeout setzen',
    [PermissionFlagsBits.ManageMessages]: 'Nachrichten verwalten',
    [PermissionFlagsBits.ManageChannels]: 'Kanäle verwalten',
    [PermissionFlagsBits.ManageRoles]: 'Rollen verwalten',
    [PermissionFlagsBits.ManageGuild]: 'Server verwalten',
    [PermissionFlagsBits.ViewAuditLog]: 'Audit-Log einsehen',
    [PermissionFlagsBits.Administrator]: 'Administrator',
  };
  return names[flag] || String(flag);
}

module.exports = { hasPermission, botHasPermission, canTargetMember, permName };
