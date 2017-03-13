'use strict';

import chalk from 'chalk';

const STYLES = {
  trace: { method: 'log', levelColor: chalk.gray, messageColor: chalk.gray },
  debug: { method: 'log', messageColor: chalk.gray },
  info: { method: 'info', levelColor: chalk.green },
  notice: { method: 'info', levelColor: chalk.yellow },
  warning: { method: 'warn', levelColor: chalk.magenta },
  error: { method: 'error', levelColor: chalk.red },
  critical: { method: 'error', levelColor: chalk.red.underline },
  alert: { method: 'error', levelColor: chalk.red.bold },
  emergency: { method: 'error', levelColor: chalk.red.bold }
};

export class ConsoleOutput {
  write(logName, hostName, level, message, options = {}) {
    message = this.format(
      logName, hostName, level, message, { colorize: true }
    );
    if (options.error) {
      message = options.error.stack || options.error;
    }
    let method = STYLES[level].method;
    console[method](message);
  }

  format(logName, hostName, level, message, options = {}) {
    let color;

    let prefix = logName || '';
    if (hostName) {
      if (prefix) prefix += '@';
      prefix += hostName;
    }
    if (prefix) {
      prefix = '[' + prefix + '] ';
      if (options.colorize) {
        prefix = chalk.gray(prefix);
      }
    }

    let levelLabel = level.toUpperCase();
    if (options.colorize) {
      color = STYLES[level].levelColor;
      if (color) levelLabel = color(levelLabel);
    }

    if (options.colorize) {
      color = STYLES[level].messageColor;
      if (color) message = color(message);
    }

    let line = prefix + levelLabel + ' ' + message;

    return line;
  }
}

export default ConsoleOutput;
