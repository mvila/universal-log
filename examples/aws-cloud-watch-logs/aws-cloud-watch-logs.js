"use strict";

var log = require('../../').create();

log.info('Hello');
for (var i = 1; i <= 5; i++) {
  log.info(i);
}
log.error('An error?');
