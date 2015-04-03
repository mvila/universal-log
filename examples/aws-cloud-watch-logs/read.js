"use strict";

var os = require('os');
var co = require('co');
var config = require('kinda-config').create();
var logs = require('kinda-aws/cloud-watch-logs').create();

var APP = config.name;
var HOST = os.hostname();
if (HOST.slice(-6) === '.local') HOST = HOST.slice(0, -6);

var getLogEvents = function *(group, stream, startTime) {
  var events = [];
  var nextToken = undefined;
  while (true) {
    var result = yield logs.getLogEvents({
      logGroupName: group,
      logStreamName: stream,
      startTime: startTime,
      startFromHead: true,
      nextToken: nextToken
    });
    if (!result.events.length) break;
    events.push.apply(events, result.events);
    nextToken = result.nextForwardToken;
  }
  return events;
};

co(function *() {
  var events = yield getLogEvents(APP, HOST);
  console.log(events.map(function(event) {
    return event.message;
  }).join('\n'));
  console.log('Count:', events.length);
}.bind(this)).catch(function(err) {
  console.error(err.stack)
});
