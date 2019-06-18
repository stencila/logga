const LOG_EVENT_NAME = Symbol('stencila:logga')

export enum LogLevel {
  error = 0,
  warn,
  info,
  debug
}

export interface LogInfo {
  message?: string
  stack?: string
}

export interface LogData {
  tag: string
  level: LogLevel
  message: string
  stack: string
}

/**
 * A listener for the log event must have this function signature.
 */
export interface LogHandler {
  (data: LogData)
}

/**
 * Take a message `string`, or `LogInfo` object,
 * and emit an event with a `LogData` object.
 *
 * If `LogData` does not have a stack attached, one is generated and set on the `LogData`.
 *
 * @param info
 * @param level
 */
function emitLogData(info: LogInfo | string, tag: string, level: LogLevel) {
  let message: string
  if (typeof info === 'object') {
    message = info.message
  } else {
    message = info
  }

  let stack: string
  if (typeof info === 'object' && info.stack) {
    stack = info.stack
  } else {
    const error = new Error()
    // Remove the first three lines of the stack trace which
    // are not useful (see issue #3)
    const lines = error.stack.split('\n')
    stack = [lines[0], ...lines.slice(3)].join('\n')
  }

  const data: LogData = { tag, level, message, stack }

  // @ts-ignore
  process.emit(LOG_EVENT_NAME, data)
}

/**
 * To decouple the listener from sender implementation, clients should use
 * this function to set up a listener.
 *
 * @param handler A function that handles the log data
 */
export function addHandler(handler?: LogHandler) {
  handler =
    handler ||
    function(data: LogData) {
      console.error(
        `${data.tag} - [${LogLevel[data.level].toUpperCase()}] - ${
          data.message
        }`
      )
    }
  // @ts-ignore
  process.on(LOG_EVENT_NAME, handler)
}

/**
 * Get a logger for the specific application or package.
 *
 * Each of the returned logger functions are the public interface for
 * posting log messages.
 *
 * @param tag The unique application or package name
 */
export function getLogger(tag: string) {
  return {
    error(message: string | LogInfo) {
      emitLogData(message, tag, LogLevel.error)
    },
    warn(message: string | LogInfo) {
      emitLogData(message, tag, LogLevel.warn)
    },
    info(message: string | LogInfo) {
      emitLogData(message, tag, LogLevel.info)
    },
    debug(message: string | LogInfo) {
      emitLogData(message, tag, LogLevel.debug)
    }
  }
}
