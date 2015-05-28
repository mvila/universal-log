'use strict';

// ./node_modules/.bin/babel-node --harmony examples/aws-cloud-watch-logs/index.js

// let co = require('co');
// let wait = require('co-wait');
let log = require('../../src/').create({
  applicationName: 'examples',
  types: {
    stdout: {
      handler: 'standard-output'
    },
    stderr: {
      handler: 'standard-error'
    },
    aws: {
      handler: 'aws-cloud-watch-logs',
      options: {
        awsCloudWatchLogs: require('./aws-config')
      }
    }
  },
  levels: {
    info: ['stdout', 'aws'],
    error: ['stderr', 'aws']
  }
});

log.info('Hello');
for (let i = 1; i <= 5; i++) {
  log.info(i);
}
log.error('An error?');

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
