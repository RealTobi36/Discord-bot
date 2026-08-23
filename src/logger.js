'use strict';

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

class Logger {
  constructor(prefix = 'Bot') {
    this.prefix = prefix;
    this.level = LEVELS[(process.env.LOG_LEVEL || 'info').toLowerCase()] ?? LEVELS.info;
  }

  _ts() {
    return new Date().toISOString().replace('T', ' ').slice(0, 19);
  }

  _log(level, color, args) {
    if (LEVELS[level] > this.level) return;
    const tag = `\x1b[${color}m${level.toUpperCase().padEnd(5)}\x1b[0m`;
    // eslint-disable-next-line no-console
    console.log(`[${this._ts()}] ${tag} [${this.prefix}]`, ...args);
  }

  error(...a) { this._log('error', '31', a); }
  warn(...a)  { this._log('warn',  '33', a); }
  info(...a)  { this._log('info',  '36', a); }
  debug(...a) { this._log('debug', '90', a); }
}

module.exports = new Logger('ModBot');
module.exports.Logger = Logger;
