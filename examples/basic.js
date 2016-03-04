'use strict';

// ./node_modules/.bin/babel-node examples/basic.js

import UniversalLog from '../src/';

let log = new UniversalLog({ appName: 'examples' });

log.addDecorator(function(message) {
  return message + ' (user@domain.com)';
});

log.silence('Should not be displayed');
log.trace('Low-level trace message');
log.debug('Small debugging message');
log.info('Little info');
log.notice('Important info');
log.warning('Be careful, something is happening');
log.error('There is something wrong');
log.critical('There is a very serious error');
log.alert('The building is on fire');
log.emergency('What could be worse?');

log.error(undefined);
log.error(new Error('Example of error'));

let timer = log.createTimer();
setTimeout(() => timer.stop(), 250);
