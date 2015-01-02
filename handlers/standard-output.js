"use strict";

var common = require('./common');

var Handler = {
  create: function(options) {
    var handler = {};

    handler.log = function(app, host, level, message) {
      message = common.format(app, host, level, message, { colorize: true });
      if (level === 'info' || level === 'notice') {
        console.info(message);
      } else if (level === 'warning') {
        console.warn(message);
      } else {
        console.log(message);
      }
    };

    return handler;
  }
};

module.exports = Handler;
