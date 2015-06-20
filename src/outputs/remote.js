'use strict';

let _ = require('lodash');
let co = require('co');
let KindaObject = require('kinda-object');
let KindaHTTPClient = require('kinda-http-client');

let RemoteOutput = KindaObject.extend('RemoteOutput', function() {
  this.creator = function(options = {}) {
    let url = options.url;
    if (!url) throw new Error('remote log handler \'url\' is missing');
    if (_.endsWith(url, '/')) url = url.slice(0, -1);
    url += '/logs';
    this.url = url;

    let httpClient = options.httpClient;
    if (!KindaHTTPClient.isClassOf(httpClient)) {
      httpClient = KindaHTTPClient.create(httpClient);
    }
    this.httpClient = httpClient;
  };

  this.write = function(appName, hostName, level, message) {
    co(function *() {
      yield this.httpClient.request({
        method: 'POST',
        url: this.url,
        body: { appName, hostName, level, message },
        json: true
      });
    }.bind(this)).catch(function(err) {
      console.error(err.stack || err);
    });
  };
});

module.exports = RemoteOutput;
