'use strict';

export class AWSCloudWatchLogsOutput {
  constructor(cloudWatchLogs) {
    if (!cloudWatchLogs) {
      throw new Error('\'cloudWatchLogs\' parameter is missing');
    }
    this.cloudWatchLogs = cloudWatchLogs;
  }

  write(logName, hostName, level, message) {
    let groupName = logName || 'unnamed-log';
    let streamName = hostName || 'unnamed-host';
    message = '[' + level.toUpperCase() + '] ' + message;
    this.cloudWatchLogs.putEvent(groupName, streamName, message);
  }
}

export default AWSCloudWatchLogsOutput;
