'use strict';

const fs = require('node:fs');
const path = require('node:path');
const logger = require('./logger');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

/**
 * Simple JSON-Datei-Datenbank mit atomaren Schreibvorgängen.
 * Speichert Guild-Einstellungen, Warns und Mutes.
 *
 * Struktur:
 * {
 *   guilds: {
 *     [guildId]: {
 *       modLogChannelId: string | null,
 *       muteRoleId: string | null,
 *       automod: { ... }
 *     }
 *   },
 *   warns: { [guildId]: [ { id, userId, moderatorId, reason, date } ] },
 *   mutes: { [guildId]: { [userId]: { expiresAt, moderatorId, reason } } }
 * }
 */
class Database {
  constructor() {
    this.data = {
      guilds: {},
      warns: {},
      mutes: {},
    };
    this._init();
  }

  _init() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = { ...this.data, ...JSON.parse(raw) };
        logger.info(`Datenbank geladen (${this._size()} Einträge)`);
      } else {
        this._save();
        logger.info('Neue Datenbank erstellt');
      }
    } catch (err) {
      logger.error('Fehler beim Laden der Datenbank:', err);
    }
  }

  _size() {
    return (
      Object.keys(this.data.guilds).length +
      Object.keys(this.data.warns).length +
      Object.keys(this.data.mutes).length
    );
  }

  _save() {
    try {
      const tmp = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(this.data, null, 2));
      fs.renameSync(tmp, DB_FILE);
    } catch (err) {
      logger.error('Fehler beim Speichern der Datenbank:', err);
    }
  }

  // ── Guild-Einstellungen ──────────────────────────────────
  getGuild(guildId) {
    if (!this.data.guilds[guildId]) {
      this.data.guilds[guildId] = {
        modLogChannelId: null,
        muteRoleId: null,
        automod: null,
      };
      this._save();
    }
    return this.data.guilds[guildId];
  }

  setGuildSetting(guildId, key, value) {
    const guild = this.getGuild(guildId);
    guild[key] = value;
    this._save();
    return guild;
  }

  // ── AutoMod ──────────────────────────────────────────────
  getAutomod(guildId, defaults) {
    const guild = this.getGuild(guildId);
    if (!guild.automod) {
      guild.automod = { ...defaults };
      this._save();
    } else {
      // fehlende Felder mit Defaults ergänzen
      guild.automod = { ...defaults, ...guild.automod };
    }
    return guild.automod;
  }

  setAutomod(guildId, automod) {
    const guild = this.getGuild(guildId);
    guild.automod = automod;
    this._save();
    return guild.automod;
  }

  // ── Warns ────────────────────────────────────────────────
  addWarn(guildId, userId, moderatorId, reason) {
    if (!this.data.warns[guildId]) this.data.warns[guildId] = [];
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      userId,
      moderatorId,
      reason: reason || 'Kein Grund angegeben',
      date: new Date().toISOString(),
    };
    this.data.warns[guildId].push(entry);
    this._save();
    return entry;
  }

  getWarns(guildId, userId = null) {
    const list = this.data.warns[guildId] || [];
    return userId ? list.filter((w) => w.userId === userId) : list;
  }

  removeWarn(guildId, warnId) {
    if (!this.data.warns[guildId]) return false;
    const before = this.data.warns[guildId].length;
    this.data.warns[guildId] = this.data.warns[guildId].filter((w) => w.id !== warnId);
    const removed = this.data.warns[guildId].length < before;
    if (removed) this._save();
    return removed;
  }

  clearWarns(guildId, userId) {
    if (!this.data.warns[guildId]) return 0;
    const before = this.data.warns[guildId].length;
    this.data.warns[guildId] = this.data.warns[guildId].filter((w) => w.userId !== userId);
    const removed = before - this.data.warns[guildId].length;
    if (removed) this._save();
    return removed;
  }

  // ── Mutes ────────────────────────────────────────────────
  addMute(guildId, userId, expiresAt, moderatorId, reason) {
    if (!this.data.mutes[guildId]) this.data.mutes[guildId] = {};
    this.data.mutes[guildId][userId] = {
      expiresAt,
      moderatorId,
      reason: reason || 'Kein Grund angegeben',
    };
    this._save();
  }

  getMute(guildId, userId) {
    return this.data.mutes[guildId]?.[userId] || null;
  }

  getExpiredMutes() {
    const now = Date.now();
    const expired = [];
    for (const [guildId, users] of Object.entries(this.data.mutes)) {
      for (const [userId, info] of Object.entries(users)) {
        if (info.expiresAt && info.expiresAt <= now) {
          expired.push({ guildId, userId, ...info });
        }
      }
    }
    return expired;
  }

  removeMute(guildId, userId) {
    if (this.data.mutes[guildId]?.[userId]) {
      delete this.data.mutes[guildId][userId];
      this._save();
      return true;
    }
    return false;
  }
}

module.exports = new Database();
