'use strict';

import util from 'util';
import environment from 'better-node-env';
import betterHostname from 'better-hostname';

import ConsoleOutput from './outputs/console';
import RemoteOutput from './outputs/remote';
// import AWSCloudWatchLogsOutput from './outputs/aws-cloud-watch-logs';

export class UniversalLog {
  // options:
  //   logName
  //   appName
  //   hostName
  //   outputs
  //   mutedLevels
  //   decorators
  constructor(options = {}) {
    let logName = options.logName;
    if (!logName) {
      logName = options.appName;
      if (logName) logName += '.'; else logName = '';
      logName += environment;
    }

    let hostName = options.hostName || betterHostname;

    let outputs = options.outputs;
    if (!outputs) {
      let output = new ConsoleOutput();
      outputs = [output];
    }

    let mutedLevels = options.mutedLevels;
    if (!mutedLevels) {
      mutedLevels = ['silence'];
      if (environment !== 'development') {
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
  }

  addOutput(output) {
    this.outputs.push(output);
  }

  addDecorator(decorator) {
    this.decorators.push(decorator);
  }

  log(level, message = 'Undefined message') {
    let options = {};

    if ((message instanceof Error) || message.toString && message.toString() === '[object ErrorEvent]') {
      let error = message;
      message = error.message || 'Unknown error';
      if (error.name) message = error.name + ': ' + message;
      if (error.filename) {
        let filename = error.filename;
        if (error.lineno) filename += ':' + error.lineno;
        message += ' (' + filename + ')';
      }
      options.error = error;
    }

    if (message && message.toJSON) message = message.toJSON();
    if (typeof message === 'object') message = util.inspect(message);
    if (typeof message !== 'string') message = String(message);

    for (let decorator of this.decorators) {
      message = decorator(message);
    }

    this.dispatch(this.logName, this.hostName, level, message, options);
  }

  dispatch(logName, hostName, level, message, options) {
    if (this.mutedLevels.includes(level)) return;
    for (let output of this.outputs) {
      output.write(logName, hostName, level, message, options);
    }
  }

  createTimer(label = 'Timer') {
    let startedAt = new Date().getTime();
    let timer = {
      stop: () => {
        let stoppedAt = new Date().getTime();
        let duration = stoppedAt - startedAt;
        this.debug(label + ': ' + duration + ' ms');
      }
    };
    return timer;
  }

  getLoggerMiddleware() { // koa logger middleware
    let that = this;
    return function *(next) {
      yield next;
      let level = this.logLevel != null ? this.logLevel : 'info';
      that[level](this.method + ' ' + this.url);
    };
  }
}

export default UniversalLog;
export { ConsoleOutput, RemoteOutput /*, AWSCloudWatchLogsOutput*/ };
