"use strict";

var _ = require('lodash');
var co = require('co');
var httpClient = require('kinda-http-client').create();
var common = require('./common');

var Handler = {
  create: function(options) {
    var url = options && options.url;
    if (!url) throw new Error('remote log handler \'url\' is missing');

    var handler = {};

    if (_.endsWith(url, '/')) url = url.slice(0, -1);
    url += '/logs';

    handler.log = function(app, host, level, message) {
      if (!process.browser) return;
      co(function *() {
        yield httpClient.request({
          method: 'POST',
          url: url,
          body: {
            app: app,
            host: host,
            level: level,
            message: message
          }
        });
      }.bind(this)).catch(function(err) {
        console.error(err.stack || err)
      });
    };

    return handler;
  }
};

module.exports = Handler;
