"use strict";

var _ = require('lodash');
var parseBody = require('co-body');
var log = require('./').create();

var logServer = {};

logServer.getMiddleware = function(prefix) {
  if (!prefix) prefix = '';
  if (_.endsWith(prefix, '/')) prefix = prefix.slice(0, -1);
  var that = this;
  return function *(next) {
    var path = this.path;

    if (prefix) {
      if (!_.startsWith(path, prefix)) return yield next;
      path = path.substr(prefix.length);
    }

    if (!(this.method === 'POST' && path === '/logs')) return yield next;

    var body = yield parseBody.json(this);
    log.dispatch(body.app, body.host, body.level, body.message);
    this.status = 204;
    this.logLevel = 'silence';
  };
};

var LogServer = {
  create: function() {
    return logServer;
  }
};

module.exports = LogServer;
