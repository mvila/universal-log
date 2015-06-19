'use strict';

let nodeUtil = require('util');
let os = require('os');
let crypto = require('crypto');
let _ = require('lodash');
let KindaObject = require('kinda-object');
let util = require('kinda-util').create();

let defaultOptions = {
  types: {
    stdout: {
      handler: 'standard-output'
    },
    stderr: {
      handler: 'standard-error'
    }
  },
  levels: {
    silence: [],
    info: ['stdout'],
    notice: ['stdout'],
    warning: ['stdout'],
    error: ['stderr'],
    critical: ['stderr'],
    alert: ['stderr'],
    emergency: ['stderr']
  }
};
if (util.getEnvironment() === 'development') {
  defaultOptions.levels.debug = ['stdout'];
}
defaultOptions.hostName = os.hostname();
if (_.endsWith(defaultOptions.hostName, '.local')) {
  defaultOptions.hostName = defaultOptions.hostName.slice(0, -('.local'.length));
}

let KindaLog = KindaObject.extend('KindaLog', function() {
  // options:
  //   applicationName
  //   hostName
  //   types
  //   levels
  this.creator = function(options = {}) {
    _.defaults(options, defaultOptions);
    this.applicationName = options.applicationName;
    this.hostName = options.hostName;
    this.types = options.types;
    this.levels = options.levels;

    // make convenient shorthands bound to the instance
    let possibleLevels = [
      'silence', 'debug', 'info', 'notice', 'warning',
      'error', 'critical', 'alert', 'emergency'
    ];
    for (let level of possibleLevels) {
      this[level] = function(...args) {
        this.log(level, ...args);
      }.bind(this);
    }
  };

  this.log = function(level, message, options) {
    if (_.isError(message) || message.toString() === '[object ErrorEvent]') {
      let error = message;
      message = error.message || 'unknown error';
      if (error.name) message = error.name + ': ' + message;
      if (error.filename) {
        let filename = error.filename;
        if (error.lineno) filename += ':' + error.lineno;
        message += ' (' + filename + ')';
      }
    }
    if (message && message.toJSON) message = message.toJSON();
    if (typeof message === 'object') message = nodeUtil.inspect(message);
    this.dispatch(this.applicationName, this.hostName, level, message, options);
  };

  this.dispatch = function(applicationName, hostName, level, message, options) {
    if (!options) options = {};
    let outputs = this.levels[level];
    if (options.addedOutputs) {
      outputs = _.union(outputs, options.addedOutputs);
    }
    if (options.removedOutputs) {
      outputs = _.difference(outputs, options.removedOutputs);
    }
    if (!outputs) return;
    outputs.forEach(function(output) {
      output = this.types[output];
      if (!output) return;
      let instance = this.class.getHandlerInstance(output.handler, output.options);
      instance.log(applicationName, hostName, level, message);
    }.bind(this));
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

KindaLog.registerHandler = function(name, handler) {
  if (!this._handlers) this._handlers = {};
  this._handlers[name] = handler;
};

KindaLog.registerHandler(
  'standard-output',
  require('./handlers/standard-output')
);

KindaLog.registerHandler(
  'standard-error',
  require('./handlers/standard-error')
);

KindaLog.registerHandler(
  'remote',
  require('./handlers/remote')
);

if (!process.browser) {
  KindaLog.registerHandler(
    'aws-cloud-watch-logs',
    require('./handlers/aws-cloud-watch-logs' + '')
  );
}

KindaLog.getHandler = function(name) {
  let handler = this._handlers[name];
  if (!handler) throw new Error('unknown handler \'' + name + '\'');
  return handler;
};

KindaLog.getHandlerInstance = _.memoize(
  function(name, options) {
    let handler = this.getHandler(name);
    let instance = handler.create(options);
    return instance;
  },
  function(name, options = {}) {
    options = JSON.stringify(options);
    options = crypto.createHash('md5').update(options).digest('hex');
    return name + ', ' + options;
  }
);

module.exports = KindaLog;
