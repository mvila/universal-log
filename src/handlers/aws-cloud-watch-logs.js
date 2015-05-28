'use strict';

let KindaObject = require('kinda-object');
let CloudWatchLogs = require('kinda-aws').CloudWatchLogs;

let AWSCloudWatchLogsHandler = KindaObject.extend('AWSCloudWatchLogsHandler', function() {
  this.creator = function(options = {}) {
    let logs = options.awsCloudWatchLogs;
    if (!CloudWatchLogs.isClassOf(logs)) logs = CloudWatchLogs.create(logs);
    this.logs = logs;
  };

  this.log = function(applicationName, hostName, level, message) {
    let groupName = applicationName || 'undefined-group';
    let streamName = hostName || 'undefined-stream';
    message = '[' + level.toUpperCase() + '] ' + message;
    this.logs.putEvent(groupName, streamName, message);
  };
});

module.exports = AWSCloudWatchLogsHandler;
