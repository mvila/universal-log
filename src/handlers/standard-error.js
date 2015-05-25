'use strict';

let KindaObject = require('kinda-object');
let common = require('./common');

let StandardErrorHandler = KindaObject.extend('StandardErrorHandler', function() {
  this.log = function(app, host, level, message) {
    message = common.format(app, host, level, message, { colorize: true });
    console.error(message);
  };
});

module.exports = StandardErrorHandler;
