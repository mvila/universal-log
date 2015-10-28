'use strict';

// ./node_modules/.bin/babel-node --harmony examples/aws-cloud-watch-logs/index.js

import UniversalLog, { AWSCloudWatchLogsOutput } from '../../src/';
import { CloudWatchLogs } from 'easy-aws';
import awsConfig from './aws-config';

let log = new UniversalLog({ appName: 'examples' });
let cloudWatchLogs = new CloudWatchLogs(awsConfig);
log.addOutput(new AWSCloudWatchLogsOutput(cloudWatchLogs));

log.info('Hello');
for (let i = 1; i <= 5; i++) {
  log.info(i);
}
log.error('An error?');

// import sleep from 'sleep-promise';
// (async function() {
//   log.info('Start');
//   await sleep(2000);
//   for (let i = 0; i < 1000; i++) {
//     log.info(i);
//     await sleep(50);
//   }
//   log.info('End');
// }).call(this).catch(function(err) {
//   console.error(err.stack || err);
// });
