'use strict';

// ./node_modules/.bin/babel-node examples/custom-output.js

import UniversalLog from '../src/';

let log = new UniversalLog({
  appName: 'examples',
  outputs: [{
    write(logName, hostName, level, message) {
      console.log(`${logName}@${hostName} [${level}] ${message}`);
    }
  }]
});

log.info('Little info');
