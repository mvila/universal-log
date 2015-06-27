'use strict';

let chalk = require('chalk');
let KindaObject = require('kinda-object');

let ConsoleOutput = KindaObject.extend('ConsoleOutput', function() {
  this.styles = {
    debug: { method: 'log', levelColor: chalk.gray, messageColor: chalk.gray },
    info: { method: 'info', levelColor: chalk.green },
    notice: { method: 'info', levelColor: chalk.yellow },
    warning: { method: 'warn', levelColor: chalk.magenta },
    error: { method: 'error', levelColor: chalk.red },
    critical: { method: 'error', levelColor: chalk.red.underline },
    alert: { method: 'error', levelColor: chalk.red.bold },
    emergency: { method: 'error', levelColor: chalk.red.bold.inverse }
  };

  this.write = function(appName, hostName, level, message, options = {}) {
    message = this.format(
      appName, hostName, level, message, { colorize: true }
    );
    if (options.error) {
      message = options.error.stack || options.error;
    }
    let method = this.styles[level].method;
    console[method](message);
  };

  this.format = function(appName, hostName, level, message, options = {}) {
    let color;

    let prefix = appName || '';
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
      color = this.styles[level].levelColor;
      if (color) levelLabel = color(levelLabel);
    }

    if (options.colorize) {
      color = this.styles[level].messageColor;
      if (color) message = color(message);
    }

    let line = prefix + levelLabel + ' ' + message;

    return line;
  };
});

module.exports = ConsoleOutput;
