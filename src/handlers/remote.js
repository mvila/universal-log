'use strict';

let _ = require('lodash');
let co = require('co');
let KindaObject = require('kinda-object');
let KindaHTTPClient = require('kinda-http-client');

let RemoteHandler = KindaObject.extend('RemoteHandler', function() {
  this.creator = function(options) {
    let url = options && options.url;
    if (!url) throw new Error('remote log handler \'url\' is missing');
    if (_.endsWith(url, '/')) url = url.slice(0, -1);
    url += '/logs';
    this.url = url;
    this.httpClient = this.create(KindaHTTPClient);
  };

  this.log = function(app, host, level, message) {
    co(function *() {
      yield this.httpClient.request({
        method: 'POST',
        url: this.url,
        body: { app, host, level, message },
        useJSON: true
      });
    }.bind(this)).catch(function(err) {
      console.error(err.stack || err);
    });
  };
});

module.exports = RemoteHandler;
