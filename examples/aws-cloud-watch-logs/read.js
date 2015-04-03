"use strict";

var os = require('os');
var co = require('co');
var config = require('kinda-config').create();
var logs = require('kinda-aws/cloud-watch-logs').create();

var APP = config.name;
var HOST = os.hostname();
if (HOST.slice(-6) === '.local') HOST = HOST.slice(0, -6);

co(function *() {
  var result = yield logs.getLogEvents({
    logGroupName: APP,
    logStreamName: HOST,
    startFromHead: true
  });
  console.log(result.events.map(function(event) {
    return event.timestamp;
  }).join('\n'));
  console.log('*****************************');
  var result = yield logs.getLogEvents({
    logGroupName: APP,
    logStreamName: HOST,
    startFromHead: true,
    nextToken: result.nextForwardToken
  });
  console.log(result.events.map(function(event) {
    return event.timestamp;
  }).join('\n'));
}.bind(this)).catch(function(err) {
  console.error(err.stack)
});
