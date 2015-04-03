"use strict";

var co = require('co');
var wait = require('co-wait');
var log = require('../../').create();

// log.info('Hello');
// for (var i = 1; i <= 5; i++) {
//   log.info(i);
// }
// log.error('An error?');

co(function *() {
  log.info('Start');
  yield wait(2000);
  for (var i = 0; i < 1000; i++) {
    log.info(i);
    yield wait(50);
  }
  log.info('End');
}.bind(this)).catch(function(err) {
  console.error(err.stack)
});
