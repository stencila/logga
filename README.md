# Logga

🌲 Emit log events from anywhere. Consistently.

[![Build status](https://travis-ci.org/stencila/logga.svg?branch=master)](https://travis-ci.org/stencila/logga)
[![Code coverage](https://codecov.io/gh/stencila/logga/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/logga)
[![NPM](https://img.shields.io/npm/v/@stencila/logga.svg?style=flat)](https://www.npmjs.com/package/@stencila/logga)
[![Greenkeeper badge](https://badges.greenkeeper.io/stencila/logga.svg)](https://greenkeeper.io/)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

## Why?

We wanted to have a unified, consistent mechanism for emitting log event data across Javascript/Typescript projects. We wanted to decouple log event emission from log event consumption. We wanted something lightweight.

For example, `encoda` and `dockta` are two Typescript projects that use `logga`. We want users of these projects to be able to use them as standalone tools and have log events printed at the command line. Both projects are also integrated into the `stencila` command line tool, and in the future, we'll also combine them into the `stencila` desktop Electron-based application. For each of these apps, we want to handle log events from both packages in a consistent way and display them in a way that is appropriate for the platform e.g. HTML messages when in Electron, log files when running as a server.

## Approach

The approach used in `logga` is to use `process` as a bus for log events. It's a simple approach, described in [this gist](https://gist.github.com/constantology/5f04d5782c1cc019722f), that combines emitting events using `process.emit()` and registering an event handler with `process.on()`.

## Install

```bash
npm install --save @stencila/logga
```

## Usage

Create a new logger by calling `getLogger` with a unique tag to identify your app and/or module. Then emit log events using the `debug`, `info`, `warn` and `error` functions. You can pass them a message string or a `LogInfo` object.

```js
const { getLogger } = require('@stencila/logga')

const log = getLogger('example')

log.debug('This is line five.')
log.info('Everything is just fine.')
log.warn('Oh, oh, not no much.')
log.error('Aaargh, an error!')

try {
  throw new Error('I am an error object.')
} catch (error) {
  const { message, stack } = error
  log.error({
    message: 'Woaaah something bad happened! ' + message,
    stack
  })
}
```

The default log handler prints log data to `stderr`. If `stderr` is TTY log data is formatted for human consumption with emoji, colours and stack trace (for errors):

![](screenshot.png)

If `stderr` is not TTY log data os formatted for machine consumption (e.g. for log files) as [ndjson](http://ndjson.org/), with a time stamp, if `stderr` (for machine consumption e.g. log files):

```json
{"time":"2019-07-02T21:19:24.872Z","tag":"example","level":3,"message":"This is line five.","stack":"Error\n    at Object.<anonymous> (/home/nokome/stencila/source/logga/example.js:21:5)\n    at Module._compile (internal/modules/cjs/loader.js:689:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)\n    at Module.load (internal/modules/cjs/loader.js:599:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:530:3)\n    at Function.Module.runMain (internal/modules/cjs/loader.js:742:12)\n    at startup (internal/bootstrap/node.js:266:19)"}
{"time":"2019-07-02T21:19:24.875Z","tag":"example","level":2,"message":"Everything is just fine.","stack":"Error\n    at Object.<anonymous> (/home/nokome/stencila/source/logga/example.js:22:5)\n    at Module._compile (internal/modules/cjs/loader.js:689:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)\n    at Module.load (internal/modules/cjs/loader.js:599:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:530:3)\n    at Function.Module.runMain (internal/modules/cjs/loader.js:742:12)\n    at startup (internal/bootstrap/node.js:266:19)"}
{"time":"2019-07-02T21:19:24.875Z","tag":"example","level":1,"message":"Oh, oh, not no much.","stack":"Error\n    at Object.<anonymous> (/home/nokome/stencila/source/logga/example.js:23:5)\n    at Module._compile (internal/modules/cjs/loader.js:689:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)\n    at Module.load (internal/modules/cjs/loader.js:599:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:530:3)\n    at Function.Module.runMain (internal/modules/cjs/loader.js:742:12)\n    at startup (internal/bootstrap/node.js:266:19)"}
{"time":"2019-07-02T21:19:24.875Z","tag":"example","level":0,"message":"Aaargh, an error!","stack":"Error\n    at Object.<anonymous> (/home/nokome/stencila/source/logga/example.js:24:5)\n    at Module._compile (internal/modules/cjs/loader.js:689:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)\n    at Module.load (internal/modules/cjs/loader.js:599:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:530:3)\n    at Function.Module.runMain (internal/modules/cjs/loader.js:742:12)\n    at startup (internal/bootstrap/node.js:266:19)"}
{"time":"2019-07-02T21:19:24.875Z","tag":"example","level":0,"message":"Woaaah something bad happened! I am an error object.","stack":"Error: I am an error object.\n    at Object.<anonymous> (/home/nokome/stencila/source/logga/example.js:27:9)\n    at Module._compile (internal/modules/cjs/loader.js:689:30)\n    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)\n    at Module.load (internal/modules/cjs/loader.js:599:32)\n    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)\n    at Function.Module._load (internal/modules/cjs/loader.js:530:3)\n    at Function.Module.runMain (internal/modules/cjs/loader.js:742:12)\n    at startup (internal/bootstrap/node.js:266:19)\n    at bootstrapNodeJSCore (internal/bootstrap/node.js:596:3)"}
```

You can register a new handler by calling `addHandler` with a handling function. Or use `replaceHandlers` to replace any existing log handlers (including the default).
