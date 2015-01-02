"use strict";

var common = require('./common');

var Handler = {
  create: function(options) {
    var handler = {};

    handler.log = function(app, host, level, message) {
      message = common.format(app, host, level, message, { colorize: true });
      console.error(message);
    };

    return handler;
  }
};

module.exports = Handler;
