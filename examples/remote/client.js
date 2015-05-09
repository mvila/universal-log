"use strict";

var log = require('../../').create();

log.silence('Should not be displayed');
log.debug('Small debugging message');
log.info('Little info');
log.notice('Important info');
log.warning('Be careful, something is happening');
log.error('There is something wrong');
log.critical('There is a very serious error');
log.alert('The building is on fire');
log.emergency('What could be worse?');
