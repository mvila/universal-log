'use strict';

let _ = require('lodash');
let co = require('co');
let wait = require('co-wait');
let KindaObject = require('kinda-object');
let KindaAWS = require('kinda-aws');

let AWSCloudWatchLogsHandler = KindaObject.extend('AWSCloudWatchLogsHandler', function() {
  this.creator = function() {
    this.logs = this.create(KindaAWS.CloudWatchLogs);
    this.queuedEvents = [];
    this.isFlushing = false;
    this.groups = {};
  };

  this.log = function(app, host, level, message) {
    let groupName = app || 'undefined-group';
    let streamName = host || 'undefined-stream';
    message = '[' + level.toUpperCase() + '] ' + message;
    this.pushEvent(groupName, streamName, message);
  };

  this.pushEvent = function(groupName, streamName, message) {
    this.queuedEvents.push({
      groupName,
      streamName,
      timestamp: Date.now(),
      message
    });
    this.flushEvents();
  };

  this.flushEvents = function() {
    if (this.isFlushing) return;
    this.isFlushing = true;
    co(function *() {
      let groupFn = function(event) {
        let key = event.groupName + ':' + event.streamName;
        delete event.groupName;
        delete event.streamName;
        return key;
      };
      while (this.queuedEvents.length) {
        // Group queuedEvents by groupName:streamName
        let groupedEvents = _.groupBy(this.queuedEvents, groupFn);
        this.queuedEvents.length = 0;

        for (let key in groupedEvents) {
          if (!groupedEvents.hasOwnProperty(key)) continue;
          let events = groupedEvents[key];
          key = key.split(':');
          let groupName = key[0];
          let streamName = key[1];
          yield this.sendEvents(groupName, streamName, events);
        }
      }
    }.bind(this)).then(
      function() {
        this.isFlushing = false;
      }.bind(this),
      function(err) {
        console.error(err);
        this.isFlushing = false;
      }.bind(this)
    );
  };

  this.sendEvents = function *(groupName, streamName, events) {
    yield this.createGroup(groupName);
    yield this.createStream(groupName, streamName);
    let didSend = false;
    while (!didSend) {
      let sequenceToken = yield this.getSequenceToken(groupName, streamName);
      try {
        // console.log('putLogEvents', events.length);
        let result = yield this.logs.putLogEvents({
          logGroupName: groupName,
          logStreamName: streamName,
          logEvents: events,
          sequenceToken
        });
        this.setSequenceToken(groupName, streamName, result.nextSequenceToken);
        didSend = true;
      } catch (err) {
        if (err.code === 'InvalidSequenceTokenException') {
          this.setSequenceToken(groupName, streamName, undefined);
          yield wait(500);
        } else if (err.code === 'DataAlreadyAcceptedException') {
          this.setSequenceToken(groupName, streamName, undefined);
          yield wait(500);
        } else if (err.code === 'OperationAbortedException') {
          yield wait(500);
        } else if (err.code === 'Throttling') {
          yield wait(3000);
        } else {
          throw err;
        }
      }
    }
  };

  this.createGroup = function *(groupName) {
    if (this.groups[groupName]) return;
    let didCreate = false;
    while (!didCreate) {
      try {
        // console.log('createLogGroup');
        yield this.logs.createLogGroup({ logGroupName: groupName });
        didCreate = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          didCreate = true;
        } else if (err.code === 'OperationAbortedException') {
          yield wait(500);
        } else if (err.code === 'Throttling') {
          yield wait(3000);
        } else {
          throw err;
        }
      }
    }
    this.groups[groupName] = { streams: {} };
  };

  this.createStream = function *(groupName, streamName) {
    let group = this.groups[groupName];
    if (!group) throw new Error('unknown group');
    if (group.streams[streamName]) return;
    let didCreate = false;
    while (!didCreate) {
      try {
        // console.log('createLogStream');
        yield this.logs.createLogStream({
          logGroupName: groupName,
          logStreamName: streamName
        });
        didCreate = true;
      } catch (err) {
        if (err.code === 'ResourceAlreadyExistsException') {
          didCreate = true;
        } else if (err.code === 'Throttling') {
          yield wait(3000);
        } else {
          throw err;
        }
      }
    }
    group.streams[streamName] = { sequenceToken: undefined };
  };

  this.getSequenceToken = function *(groupName, streamName) {
    let group = this.groups[groupName];
    if (!group) throw new Error('unknown group');
    let stream = group.streams[streamName];
    if (!stream) throw new Error('unknown stream');
    if (!stream.sequenceToken) {
      // console.log('describeLogStreams');
      let result;
      let didDescribe = false;
      while (!didDescribe) {
        try {
          result = yield this.logs.describeLogStreams({
            logGroupName: groupName,
            logStreamNamePrefix: streamName
          });
          didDescribe = true;
        } catch (err) {
          if (err.code === 'Throttling') {
            yield wait(3000);
          } else {
            throw err;
          }
        }
      }
      result = _.find(result.logStreams, 'logStreamName', streamName);
      if (!result) throw new Error('stream not found');
      stream.sequenceToken = result.uploadSequenceToken;
    }
    return stream.sequenceToken;
  };

  this.setSequenceToken = function(groupName, streamName, sequenceToken) {
    let group = this.groups[groupName];
    if (!group) throw new Error('unknown group');
    let stream = group.streams[streamName];
    if (!stream) throw new Error('unknown stream');
    stream.sequenceToken = sequenceToken;
  };
});

module.exports = AWSCloudWatchLogsHandler;
