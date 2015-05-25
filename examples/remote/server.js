'use strict';

// ./node_modules/.bin/babel-node --harmony examples/remote/server.js &

let http = require('http');
let koa = require('koa');
let logServer = require('kinda-log-server').create();

let port = 8888;
let prefix = '/v1';

let server = koa();
server.use(logServer.getMiddleware(prefix));
let httpServer = http.createServer(server.callback());
httpServer.listen(port, function() {
  console.log('Listening on port ' + port);
});
