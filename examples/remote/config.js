"use strict";

var config = {
  'kinda-log': {
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
  }
};

module.exports = config;
