'use strict';

let nodeUtil = require('util');
let os = require('os');
let _ = require('lodash');
let KindaObject = require('kinda-object');
let util = require('kinda-util').create();

let HOST = os.hostname();
if (_.endsWith(HOST, '.local')) HOST = HOST.slice(0, -('.local'.length));

let KindaLog = KindaObject.extend('KindaLog', function() {
  this.creator = function(instanceOptions) {
    let options = {
      types: {
        stdout: {
          handler: 'standard-output'
        },
        stderr: {
          handler: 'standard-error'
        },
        aws: {
          handler: 'aws-cloud-watch-logs'
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
    if (util.getEnvironment() === 'development') options.levels.debug = ['stdout'];
    _.merge(options, this.getOptionsFromContext());
    _.merge(options, instanceOptions);
    this.types = options.types;
    this.levels = options.levels;
    this.name = options.name;
  };

  this.getOptionsFromContext = function() {
    let options = {};
    if ('name' in this.context) {
      options.name = this.context.name;
    }
    if ('logTypes' in this.context) {
      options.types = this.context.logTypes;
    }
    if ('logLevels' in this.context) {
      options.levels = this.context.logLevels;
    }
    return options;
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
    this.dispatch(this.name, HOST, level, message, options);
  };

  this.dispatch = function(app, host, level, message, options) {
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
      let instance = this.class.getHandlerInstance(this, output.handler, output.options);
      instance.log(app, host, level, message);
    }.bind(this));
  };

  let possibleLevels = [
    'silence', 'debug', 'info', 'notice', 'warning',
    'error', 'critical', 'alert', 'emergency'
  ];
  possibleLevels.forEach(function(level) {
    this[level] = function(...args) {
      this.log(level, ...args);
    };
  }, this);

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

KindaLog.getHandlerInstance = function(parent, name, options) {
  if (!this._handlerInstanceRecords) this._handlerInstanceRecords = [];
  let instanceRecord = _.find(this._handlerInstanceRecords, function(h) {
    return h.name === name && _.isEqual(h.options, options);
  });
  if (instanceRecord) return instanceRecord.instance;
  let handler = this.getHandler(name);
  let instance = parent.create(handler, options);
  instanceRecord = { name, options, instance };
  this._handlerInstanceRecords.push(instanceRecord);
  return instance;
};

module.exports = KindaLog;
