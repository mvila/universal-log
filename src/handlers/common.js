'use strict';

let chalk = require('chalk');

let common = {};

let styles = {
  debug: { levelColor: chalk.gray, messageColor: chalk.gray },
  info: { levelColor: chalk.green },
  notice: { levelColor: chalk.yellow },
  warning: { levelColor: chalk.magenta },
  error: { levelColor: chalk.red },
  critical: { levelColor: chalk.red.underline },
  alert: { levelColor: chalk.red.bold },
  emergency: { levelColor: chalk.red.bold.inverse }
};

common.format = function(app, host, level, message, options) {
  if (!options) options = {};

  let color;

  let prefix = app || '';
  if (host) {
    if (prefix) prefix += '@';
    prefix += host;
  }
  if (prefix) {
    prefix = '[' + prefix + '] ';
    if (options.colorize) {
      prefix = chalk.gray(prefix);
    }
  }

  let levelLabel = level.toUpperCase();
  if (options.colorize) {
    color = styles[level].levelColor;
    if (color) levelLabel = color(levelLabel);
  }

  if (options.colorize) {
    color = styles[level].messageColor;
    if (color) message = color(message);
  }

  let line = prefix + levelLabel + ' ' + message;

  return line;
};

module.exports = common;
