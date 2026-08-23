'use strict';

const { time, TimestampStyles } = require('discord.js');

/**
 * Parst menschliche Zeitangaben wie "10m", "1h", "2d", "30s".
 * @param {string} input
 * @returns {number|null} Millisekunden oder null bei ungültiger Eingabe
 */
function parseDuration(input) {
  if (!input) return null;
  const match = input.match(/^(\d+)\s*(s|m|h|d|w)$/i);
  if (!match) return null;
  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();
  const multipliers = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000, w: 604_800_000 };
  return value * multipliers[unit];
}

/**
 * Formatiert Millisekunden als lesbare Dauer (z.B. "2 Stunden 30 Minuten").
 */
function formatDuration(ms) {
  if (!ms || ms <= 0) return 'Permanent';
  const seconds = Math.floor(ms / 1000);
  const units = [
    { label: 'Woche', value: 604800 },
    { label: 'Tag', value: 86400 },
    { label: 'Stunde', value: 3600 },
    { label: 'Minute', value: 60 },
    { label: 'Sekunde', value: 1 },
  ];
  const parts = [];
  let remaining = seconds;
  for (const unit of units) {
    const count = Math.floor(remaining / unit.value);
    if (count > 0) {
      parts.push(`${count} ${unit.label}${count !== 1 ? 'n' : ''}`);
      remaining %= unit.value;
    }
  }
  return parts.join(' ') || '0 Sekunden';
}

/**
 * Discord relativer Zeitstempel für eine Deadline.
 */
function relativeTimestamp(date) {
  return time(date, TimestampStyles.RelativeTime);
}

function fullTimestamp(date) {
  return time(date, TimestampStyles.ShortDateTime);
}

module.exports = { parseDuration, formatDuration, relativeTimestamp, fullTimestamp };
