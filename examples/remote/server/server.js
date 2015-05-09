"use strict";

var http = require('http');
var koa = require('koa');
var logServer = require('../../../server').create();

var port = 8888;
var prefix = '/v1';

var server = koa();
server.use(logServer.getMiddleware(prefix));
var httpServer = http.createServer(server.callback());
httpServer.listen(port, function() {
  console.log('Listening on port ' + port);
});
