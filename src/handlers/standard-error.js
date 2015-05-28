'use strict';

let KindaObject = require('kinda-object');
let common = require('./common');

let StandardErrorHandler = KindaObject.extend('StandardErrorHandler', function() {
  this.log = function(applicationName, hostName, level, message) {
    message = common.format(
      applicationName, hostName, level, message, { colorize: true }
    );
    console.error(message);
  };
});

module.exports = StandardErrorHandler;
