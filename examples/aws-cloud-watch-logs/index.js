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

// let util = require('kinda-util').create();
// (async function() {
//   log.info('Start');
//   await util.timeout(2000);
//   for (let i = 0; i < 1000; i++) {
//     log.info(i);
//     await util.timeout(50);
//   }
//   log.info('End');
// }).call(this).catch(function(err) {
//   console.error(err.stack || err);
// });
