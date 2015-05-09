"use strict";

var config = {
  'kinda-log': {
    levels: {
      debug: ['stdout'],
      info: ['stdout'],
      notice: ['stdout'],
      warning: ['stdout'],
      error: ['stderr'],
      critical: ['stderr'],
      alert: ['stderr'],
      emergency: ['stderr']
    }
  }
};

module.exports = config;
