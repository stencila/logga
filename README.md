# Logga

🌲 Emit log events from anywhere. Consistently.

[![Build status](https://travis-ci.org/stencila/logga.svg?branch=master)](https://travis-ci.org/stencila/logga)
[![Code coverage](https://codecov.io/gh/stencila/logga/branch/master/graph/badge.svg)](https://codecov.io/gh/stencila/logga)
[![NPM](https://img.shields.io/npm/v/@stencila/logga.svg?style=flat)](https://www.npmjs.com/package/@stencila/logga)
[![Greenkeeper badge](https://badges.greenkeeper.io/stencila/logga.svg)](https://greenkeeper.io/)
[![Chat](https://badges.gitter.im/stencila/stencila.svg)](https://gitter.im/stencila/stencila)

## Why?

We wanted to have a unified, consistent mechanism for emitting log event data across Javascript/Typescript projects. We wanted to decouple log event emission from log event consumption. We wanted something lightweight.

For example, `encoda` and `dockta` are two Typescript projects that use `logga` which we combine in the `stencila` command line tool. In the future, we'll also combine them into the `stencila` desktop Electron-based application. We want users of `encoda` and `dockta` to be able to use them as standalone tools, at the command line, and get feedback at the command line. But we also want to be able to handle log events from these packages in apps that integrate them and which may use a fancier CLI display (e.g. [Ink](https://github.com/vadimdemedes/ink)) or a HTML UI display (e.g. in Electron).

## Approach

The approach used in `logga` is to use `process` as a bus for log events. It's a simple approach, described in [this gist](https://gist.github.com/constantology/5f04d5782c1cc019722f), that combines emitting events using `process.emit()` and registering an event handler with `process.on()`.

## Install

```bash
npm install --save @stencila/logga
```

## Usage

Create a new logger by calling `getLogger` with a unique tag to identify your app and/or module. Then emit log events using the `debug`, `info`, `warn` or `error` function (you can pass them a message string or a `LogInfo` object).

```ts
import { getLogger } from '@stencila/logga'

const logger = getLogger('app:module')

function doSomething() {
  logger.debug('A debug message')

  try {
    // ...
  } catch (error) {
    const { message, stack } = error
    logger.error({
      message: 'Woaaah something bad happened! ' + message,
      stack
    })
  }
}
```

The default log handler prints log data to `stderr`:

- with emoji, colours and stack trace (for errors) if `stderr` is TTY (for human consumption)
- as JSON, with a time stamp, if `stderr` is not TTY (for machine consumption e.g. log files)

You can register a new handler by calling `addHandler` with a handling function. Or use `replaceHandlers` to replace any existing log handlers (including the default) with your custom handler.
