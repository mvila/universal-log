'use strict';

var nodeUtil = require('util');
var os = require('os');
var _ = require('lodash');
var config = require('kinda-config').create();

var APP = config.name;
var HOST = os.hostname();
if (HOST.slice(-6) === '.local') HOST = HOST.slice(0, -6);

var defaultConfig = {
  outputs: {
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
    $development: { debug: ['stdout'] },
    info: ['stdout'],
    notice: ['stdout'],
    warning: ['stdout'],
    error: ['stderr'],
    critical: ['stderr'],
    alert: ['stderr'],
    emergency: ['stderr']
  }
};

var moduleConfig = require('kinda-config').get('kinda-log', defaultConfig);

var kindaLog = {};

kindaLog.registerHandler = function(name, handler) {
  if (!this._handlers) this._handlers = {};
  this._handlers[name] = handler;
};

kindaLog.registerHandler(
  'standard-output',
  require('./handlers/standard-output')
);

kindaLog.registerHandler(
  'standard-error',
  require('./handlers/standard-error')
);

kindaLog.registerHandler(
  'remote',
  require('./handlers/remote')
);

if (!process.browser) {
  kindaLog.registerHandler(
    'aws-cloud-watch-logs',
    require('./handlers/aws-cloud-watch-logs' + '')
  );
}

kindaLog.getHandler = function(name) {
  var handler = this._handlers[name];
  if (!handler) throw new Error("unknown handler '" + name + "'");
  return handler;
};

kindaLog.getHandlerInstance = function(name, options) {
  if (!this._handlerInstanceRecords) this._handlerInstanceRecords = [];
  var instanceRecord = _.find(this._handlerInstanceRecords, function(h) {
    return h.name === name && _.isEqual(h.options, options);
  });
  if (instanceRecord) return instanceRecord.instance;
  var handler = this.getHandler(name);
  var instance = handler.create(options);
  instanceRecord = {
    name: name,
    options: options,
    instance: instance
  };
  this._handlerInstanceRecords.push(instanceRecord);
  return instance;
};

kindaLog.log = function(level, message) {
  if (message && message.toJSON) message = message.toJSON();
  if (typeof message === 'object') message = nodeUtil.inspect(message);
  this.dispatch(APP, HOST, level, message);
};

kindaLog.dispatch = function(app, host, level, message) {
  var outputs = moduleConfig.levels[level];
  if (!outputs) return;
  outputs.forEach(function(output) {
    output = moduleConfig.outputs[output];
    if (!output) return;
    var instance = this.getHandlerInstance(output.handler, output.options);
    instance.log(app, host, level, message);
  }.bind(this));
};

kindaLog.silence = kindaLog.log.bind(kindaLog, 'silence');
kindaLog.debug = kindaLog.log.bind(kindaLog, 'debug');
kindaLog.info = kindaLog.log.bind(kindaLog, 'info');
kindaLog.notice = kindaLog.log.bind(kindaLog, 'notice');
kindaLog.warning = kindaLog.log.bind(kindaLog, 'warning');
kindaLog.error = kindaLog.log.bind(kindaLog, 'error');
kindaLog.critical = kindaLog.log.bind(kindaLog, 'critical');
kindaLog.alert = kindaLog.log.bind(kindaLog, 'alert');
kindaLog.emergency = kindaLog.log.bind(kindaLog, 'emergency');

var timerStartedAt;

kindaLog.startTimer = function() {
  timerStartedAt = new Date().getTime();
};

kindaLog.stopTimer = function() {
  var timerStoppedAt = new Date().getTime();
  var duration = timerStoppedAt - timerStartedAt;
  this.info('Timer: ' + duration + ' ms');
};

kindaLog.logger = function(next) { // koa middleware
  return function *(next) {
    yield next;
    var level = this.logLevel != null ? this.logLevel : 'info';
    kindaLog[level](this.method + ' ' + this.url);
  }
};

var KindaLog = {
  create: function() {
    return kindaLog;
  }
};

module.exports = KindaLog;
