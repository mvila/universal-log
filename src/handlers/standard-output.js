'use strict';

let KindaObject = require('kinda-object');
let common = require('./common');

let StandardOutputHandler = KindaObject.extend('StandardOutputHandler', function() {
  this.log = function(app, host, level, message) {
    message = common.format(app, host, level, message, { colorize: true });
    if (level === 'info' || level === 'notice') {
      console.info(message);
    } else if (level === 'warning') {
      console.warn(message);
    } else {
      console.log(message);
    }
  };
});

module.exports = StandardOutputHandler;
