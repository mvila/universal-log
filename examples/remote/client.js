'use strict';

// ./node_modules/.bin/babel-node examples/remote/client.js

let log = require('../../src/').create({
  name: 'examples',
  types: {
    remote: {
      handler: 'remote',
      options: {
        url: 'http://localhost:8888/v1'
      }
    }
  },
  levels: {
    debug: ['remote'],
    info: ['remote'],
    notice: ['remote'],
    warning: ['remote'],
    error: ['remote'],
    critical: ['remote'],
    alert: ['remote'],
    emergency: ['remote']
  }
});

log.silence('Should not be displayed');
log.debug('Small debugging message');
log.info('Little info');
log.notice('Important info');
log.warning('Be careful, something is happening');
log.error('There is something wrong');
log.critical('There is a very serious error');
log.alert('The building is on fire');
log.emergency('What could be worse?');
