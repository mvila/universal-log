"use strict";

var _ = require('lodash');
var co = require('co');
var wait = require('co-wait');
var logs = require('kinda-aws/cloud-watch-logs').create();
var common = require('./common');

var Handler = {
  create: function(options) {
    var handler = {};

    handler.log = function(app, host, level, message) {
      var groupName = app || 'undefined-group';
      var streamName = host || 'undefined-stream';
      message = '[' + level.toUpperCase() + '] ' + message;
      pushEvent(groupName, streamName, message);
    };

    var queuedEvents = [];

    var pushEvent = function(groupName, streamName, message) {
      queuedEvents.push({
        groupName: groupName,
        streamName: streamName,
        timestamp: Date.now(),
        message: message
      });
      flushEvents();
    }

    var isFlushing = false;

    var flushEvents = function() {
      if (isFlushing) return;
      isFlushing = true;
      co(function *() {
        while (queuedEvents.length) {
          // Group queuedEvents by groupName:streamName
          var groupedEvents = _.groupBy(queuedEvents, function(event) {
            var key = event.groupName + ':' + event.streamName;
            delete event.groupName;
            delete event.streamName;
            return key;
          });
          queuedEvents.length = 0;

          for (var key in groupedEvents) {
            if (!groupedEvents.hasOwnProperty(key)) continue;
            var events = groupedEvents[key];
            key = key.split(':');
            var groupName = key[0];
            var streamName = key[1];
            yield sendEvents(groupName, streamName, events);
          }
        }
      }).then(
        function() {
          isFlushing = false;
        },
        function(err) {
          console.error(err);
          isFlushing = false;
        }
      );
    };

    var sendEvents = function *(groupName, streamName, events) {
      yield createGroup(groupName);
      yield createStream(groupName, streamName);
      var didSend = false;
      while (!didSend) {
        var sequenceToken = yield getSequenceToken(groupName, streamName);
        try {
          // console.log('putLogEvents', events.length);
          var result = yield logs.putLogEvents({
            logGroupName: groupName,
            logStreamName: streamName,
            logEvents: events,
            sequenceToken: sequenceToken
          });
          setSequenceToken(groupName, streamName, result.nextSequenceToken);
          didSend = true;
        } catch (err) {
          if (err.code === 'InvalidSequenceTokenException') {
            setSequenceToken(groupName, streamName, undefined);
            yield wait(500);
          } else if (err.code === 'DataAlreadyAcceptedException') {
            setSequenceToken(groupName, streamName, undefined);
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

    var groups = {};

    var createGroup = function *(groupName) {
      if (groups[groupName]) return;
      var didCreate = false;
      while (!didCreate) {
        try {
          // console.log('createLogGroup');
          yield logs.createLogGroup({ logGroupName: groupName });
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
      groups[groupName] = { streams: {} };
    };

    var createStream = function *(groupName, streamName) {
      var group = groups[groupName];
      if (!group) throw new Error('unknown group');
      if (group.streams[streamName]) return;
      var didCreate = false;
      while (!didCreate) {
        try {
          // console.log('createLogStream');
          yield logs.createLogStream({
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

    var getSequenceToken = function *(groupName, streamName) {
      var group = groups[groupName];
      if (!group) throw new Error('unknown group');
      var stream = group.streams[streamName];
      if (!stream) throw new Error('unknown stream');
      if (!stream.sequenceToken) {
        // console.log('describeLogStreams');
        var result;
        var didDescribe = false;
        while (!didDescribe) {
          try {
            result = yield logs.describeLogStreams({
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

    var setSequenceToken = function(groupName, streamName, sequenceToken) {
      var group = groups[groupName];
      if (!group) throw new Error('unknown group');
      var stream = group.streams[streamName];
      if (!stream) throw new Error('unknown stream');
      stream.sequenceToken = sequenceToken;
    };

    return handler;
  }
};

module.exports = Handler;
