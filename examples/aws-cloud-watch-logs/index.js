'use strict';

// ./node_modules/.bin/babel-node --harmony examples/aws-cloud-watch-logs/index.js

let KindaLog = require('../../src/');
let awsConfig = require('./aws-config');

let log = KindaLog.create({ appName: 'examples' });
log.addOutput(KindaLog.AWSCloudWatchLogsOutput.create({
  awsCloudWatchLogs: awsConfig
}));

log.info('Hello');
for (let i = 1; i <= 5; i++) {
  log.info(i);
}
log.error('An error?');

// let co = require('co');
// let wait = require('co-wait');
//
// co(function *() {
//   log.info('Start');
//   yield wait(2000);
//   for (let i = 0; i < 1000; i++) {
//     log.info(i);
//     yield wait(50);
//   }
//   log.info('End');
// }).catch(function(err) {
//   console.error(err.stack);
// });
