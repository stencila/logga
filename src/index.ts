const LOG_EVENT_NAME = 'stencila:logga'

enum LogLevel {
  emerg = 0,
  alert,
  crit,
  error,
  warning,
  notice,
  info,
  debug
}

interface LoggerFunction {
  (appName: string, message: string | LogData, level: LogLevel)
}

interface LogDefinition {
  emerg: LoggerFunction
  alert: LoggerFunction
  crit: LoggerFunction
  error: LoggerFunction
  warning: LoggerFunction
  notice: LoggerFunction
  info: LoggerFunction
  debug: LoggerFunction
}

/**
 * This function sends the log off to be processed.
 *
 * @param appName
 * @param data
 */
function emitLog(appName: string, data: LogData) {
  // @ts-ignore
  process.emit(LOG_EVENT_NAME, appName, data)
}

export interface LogData {
  message: string
  stackTrace?: string
  level: LogLevel
}

/**
 * The listener for the log event must have this function signature.
 */
export interface LoggerHandler {
  (appName: string, message: LogData)
}

/**
 * Take a message string, or LogData object, and always returns a LogData object.
 *
 * If LogData already has a level set, then level will not be applied to it.
 * If LogData does not have a stackTrace attached, one is generated and set on the LogData.
 *
 * @param data
 * @param level
 */
function convertToLogData(data: LogData | string, level: LogLevel): LogData {
  let transformedData: LogData

  if (typeof data === 'string') {
    transformedData = {
      message: data,
      level: level
    }
  } else {
    transformedData = data
  }

  if (!transformedData.stackTrace) {
    const error = new Error()
    transformedData.stackTrace = error.stack
  }

  return transformedData
}

/**
 * To decouple the listener from sender implementation, clients should use this function to set up a listener.
 *
 * @param handler
 */
export function addLogHandler(handler?: LoggerHandler) {
  if (!handler) {
    handler = function(appName: string, data: LogData) {
      const outputFunction =
        data.level <= LogLevel.error ? console.error : console.log

      outputFunction(appName + ': ' + data.message)
    }
  }

  // @ts-ignore
  process.on(LOG_EVENT_NAME, handler)
}

/**
 * Get a logger for the specific appName.
 *
 * Each logger function is the public interface for posting messages.
 *
 * @param appName
 */
export function getLogger(appName: string): LogDefinition {
  return {
    emerg(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.emerg))
    },
    alert(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.alert))
    },
    crit(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.crit))
    },
    error(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.error))
    },
    warning(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.warning))
    },
    notice(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.notice))
    },
    info(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.info))
    },
    debug(message: string | LogData) {
      emitLog(appName, convertToLogData(message, LogLevel.debug))
    }
  }
}
