const LOG_EVENT_NAME = Symbol('stencila:logga')

export enum LogLevel {
  emerg = 0,
  alert,
  crit,
  error,
  warning,
  notice,
  info,
  debug
}

export interface LogInfo {
  message?: string
  stackTrace?: string
}

export interface LogData {
  appName: string
  level: LogLevel
  message: string
  stackTrace: string
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
 * If `LogData` does not have a stackTrace attached, one is generated and set on the `LogData`.
 *
 * @param info
 * @param level
 */
function emitLogData(info: LogInfo | string, appName: string, level: LogLevel) {
  let message: string
  if (typeof info === 'object') {
    message = info.message
  } else {
    message = info
  }

  let stackTrace: string
  if (typeof info === 'object' && info.stackTrace) {
    stackTrace = info.stackTrace
  } else {
    const error = new Error()
    stackTrace = error.stack
  }

  const data: LogData = { appName, level, message, stackTrace }

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
        `${data.appName} - [${LogLevel[data.level].toUpperCase()}] - ${
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
 * @param appName The unique application or package name
 */
export function getLogger(appName: string) {
  return {
    emerg(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.emerg)
    },
    alert(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.alert)
    },
    crit(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.crit)
    },
    error(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.error)
    },
    warning(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.warning)
    },
    notice(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.notice)
    },
    info(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.info)
    },
    debug(message: string | LogInfo) {
      emitLogData(message, appName, LogLevel.debug)
    }
  }
}
