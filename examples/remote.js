'use strict';

// ./node_modules/.bin/babel-node examples/remote.js

import UniversalLog, { RemoteOutput } from '../src/';

let log = new UniversalLog({
  appName: 'examples',
  outputs: [new RemoteOutput('http://localhost:8888/v1')]
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
