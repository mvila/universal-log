# UniversalLog [![Build Status](https://travis-ci.org/mvila/universal-log.svg?branch=master)](https://travis-ci.org/mvila/universal-log)

Flexible logger for Node.js and Browserify.

## Installation

```
npm install --save universal-log
```

## Usage

```javascript
import UniversalLog from 'universal-log';

let log = new UniversalLog({ appName: 'example' });

log.info('Little info');
log.error('There is something wrong');
```

## Concepts

### Levels

There are 9 levels of logging: `silence`, `debug`, `info`, `notice`, `warning`,
`error`, `critical`, `alert` and `emergency`.

Depending on the type of output, a level can have an effect on the way a log message is formated. For example, the `ConsoleOutput` uses different colors for each levels.

A `muteLevels` option allows to mute some levels. By default, the `silence` level is muted. The `debug` level is also muted when `NODE_ENV` is undefined or equal to `'development'`.

### Outputs

You can configure where you want to output your log messages.

For now, the supported outputs are:

- `ConsoleOutput` writes logs to Node.js or browser console.
- `RemoteOutput` sends logs to a [UniversalLogServer](https://github.com/mvila/universal-log-server).
- `AWSCloudWatchLogsOutput` sends logs to [AWS CloudWatch Logs](https://aws.amazon.com/cloudwatch/details/#log-monitoring).

It is easy to create your own type of output. An output is just an object with a `write(logName, hostName, level, message)` method. See an [example of custom output](https://github.com/mvila/universal-log/blob/master/examples/custom-output.js).

## API

### `new UniversalLog([options])`

Create an instance of UniversalLog.

```javascript
import UniversalLog from 'universal-log';

let log = new UniversalLog({ appName: 'example' });
```

#### `options`

- `logName`: the name of the log. If not specified, the name is a combination of `appName` and `NODE_ENV`.
- `appName`: the name of the running application.
- `hostName`: the name of the host where the application is running. If not specified, `hostName` is determined from the hostname of the machine. If the application is running in a browser, `hostName` defaults to `'browser'`.
- `outputs`: the outputs where all the logging goes. The default is an instance of `ConsoleOutput`.
- `muteLevels`: mute the specified levels. By default, the `silence` level is muted. The `debug` level is also muted when `NODE_ENV` is undefined or equal to `'development'`.
- `decorators`: a simple way to "decorate" log messages. A decorator is a function receiving a string (a log message) and returning a string (the decorated log message). Decorators are useful to  add some contextual information to log messages. For example, a decorator could be used to add the name of the current user.

### `log.log(level, messsage)`

Log a message with the specified level.

```javascript
log.log('info', 'Little info');
log.log('warning', 'There is something wrong');
```

### `log.{level}(messsage)`

Convenient shorthand methods to log messages with different levels.

```javascript
log.debug('Little info');
log.error('There is something wrong');
log.warning('Be careful, something is happening');
```

### `log.createTimer([label])`

Measure and log the time passed doing something.

```javascript
let timer = log.createTimer('Heavy computation');
// ...
timer.stop();
```

## License

MIT
