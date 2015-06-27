'use strict';

let nodeUtil = require('util');
let os = require('os');
let _ = require('lodash');
let KindaObject = require('kinda-object');
let util = require('kinda-util').create();

let KindaLog = KindaObject.extend('KindaLog', function() {
  // options:
  //   appName
  //   hostName
  //   outputs
  //   mutedLevels
  this.creator = function(options = {}) {
    if (!options.hostName) {
      options.hostName = os.hostname();
      if (_.endsWith(options.hostName, '.local')) {
        options.hostName = options.hostName.slice(0, -('.local'.length));
      }
    }

    if (!options.outputs) {
      let output = KindaLog.ConsoleOutput.create();
      options.outputs = [output];
    }

    if (!options.mutedLevels) {
      options.mutedLevels = ['silence'];
      if (util.getEnvironment() !== 'development') {
        options.mutedLevels.push('debug');
      }
    }

    this.appName = options.appName;
    this.hostName = options.hostName;
    this.outputs = options.outputs;
    this.mutedLevels = options.mutedLevels;

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
    this.dispatch(this.appName, this.hostName, level, message, options);
  };

  this.dispatch = function(appName, hostName, level, message, options) {
    if (_.includes(this.mutedLevels, level)) return;
    this.outputs.forEach(output => {
      output.write(appName, hostName, level, message, options);
    });
  };

  this.startTimer = function() {
    this._timerStartedAt = new Date().getTime();
  };

  this.stopTimer = function() {
    let timerStoppedAt = new Date().getTime();
    let duration = timerStoppedAt - this._timerStartedAt;
    this.info('Timer: ' + duration + ' ms');
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
