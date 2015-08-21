'use strict';

let nodeUtil = require('util');
let _ = require('lodash');
let KindaObject = require('kinda-object');
let util = require('kinda-util').create();

let KindaLog = KindaObject.extend('KindaLog', function() {
  // options:
  //   logName
  //   appName
  //   hostName
  //   outputs
  //   mutedLevels
  //   decorators
  this.creator = function(options = {}) {
    let logName = options.logName;
    if (!logName) {
      logName = options.appName;
      if (logName) logName += '.'; else logName = '';
      logName += util.getEnvironment();
    }

    let hostName = options.hostName || util.getHostName();

    let outputs = options.outputs;
    if (!outputs) {
      let output = KindaLog.ConsoleOutput.create();
      outputs = [output];
    }

    let mutedLevels = options.mutedLevels;
    if (!mutedLevels) {
      mutedLevels = ['silence'];
      if (util.getEnvironment() !== 'development') {
        mutedLevels.push('debug');
      }
    }

    let decorators = options.decorators || [];

    this.logName = logName;
    this.hostName = hostName;
    this.outputs = outputs;
    this.mutedLevels = mutedLevels;
    this.decorators = decorators;

    // make convenient shorthands bound to the instance
    let levels = [
      'silence', 'debug', 'info', 'notice', 'warning',
      'error', 'critical', 'alert', 'emergency'
    ];
    for (let level of levels) {
      this[level] = function(...args) {
        this.log(level, ...args);
      }.bind(this);
    }
  };

  this.addOutput = function(output) {
    this.outputs.push(output);
  };

  this.addDecorator = function(decorator) {
    this.decorators.push(decorator);
  };

  this.log = function(level, message = 'undefined message') {
    let options = {};

    if (_.isError(message) || message.toString && message.toString() === '[object ErrorEvent]') {
      let error = message;
      message = error.message || 'unknown error';
      if (error.name) message = error.name + ': ' + message;
      if (error.filename) {
        let filename = error.filename;
        if (error.lineno) filename += ':' + error.lineno;
        message += ' (' + filename + ')';
      }
      options.error = error;
    }

    if (message && message.toJSON) message = message.toJSON();
    if (typeof message === 'object') message = nodeUtil.inspect(message);
    if (!_.isString(message)) message = String(message);

    for (let decorator of this.decorators) {
      message = decorator(message);
    }

    this.dispatch(this.logName, this.hostName, level, message, options);
  };

  this.dispatch = function(logName, hostName, level, message, options) {
    if (_.includes(this.mutedLevels, level)) return;
    this.outputs.forEach(output => {
      output.write(logName, hostName, level, message, options);
    });
  };

  this.createTimer = function(label = 'Timer') {
    let startedAt = new Date().getTime();
    let timer = {
      stop: () => {
        let stoppedAt = new Date().getTime();
        let duration = stoppedAt - startedAt;
        this.debug(label + ': ' + duration + ' ms');
      }
    };
    return timer;
  };

  this.getLoggerMiddleware = function() { // koa logger middleware
    let that = this;
    return function *(next) {
      yield next;
      let level = this.logLevel != null ? this.logLevel : 'info';
      that[level](this.method + ' ' + this.url);
    };
  };
});

KindaLog.ConsoleOutput = require('./outputs/console');
KindaLog.RemoteOutput = require('./outputs/remote');
if (!process.browser) {
  KindaLog.AWSCloudWatchLogsOutput = require('./outputs/aws-cloud-watch-logs');
}

module.exports = KindaLog;
