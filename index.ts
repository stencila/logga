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
  handler = handler || defaultHandler
  // @ts-ignore
  process.addListener(LOG_EVENT_NAME, handler)
}

/**
 * Remove a handler.
 *
 * @param handler Handler to remove
 */
export function removeHandler(handler?: LogHandler) {
  handler = handler || defaultHandler
  process.removeListener(LOG_EVENT_NAME, handler)
}

/**
 * Remove all handlers.
 */
export function removeHandlers() {
  process.removeAllListeners(LOG_EVENT_NAME)
}

/**
 * Replace all existing handlers with a new handler.
 *
 * This is a convenience function that can be used to
 * replace the default handler with a new one which logs
 * to the console.
 */
export function replaceHandlers(handler: LogHandler) {
  removeHandlers()
  addHandler(handler)
}

/**
 * Default log data handler.
 *
 * Prints the data to stderr:
 *
 * - with cutesy emoji, colours and stack (for errors) if stderr is TTY (for human consumption)
 * - as JSON if stderr is not TTY (for machine consumption e.g. log files)
 *
 * @param data The log data to handle
 */
export function defaultHandler(data: LogData) {
  let entry
  if (process.stderr.isTTY) {
    const { tag, level, message, stack } = data
    const index = level < 0 ? 0 : level > 3 ? 3 : level
    const label = LogLevel[index].toUpperCase().padEnd(5, ' ')
    const emoji = [
      '🚨', // error
      '⚠', // warn
      '🛈', // info
      '🐛' // debug
    ][index]
    const colour = [
      '\u001b[31;1m', // red
      '\u001b[33;1m', // yellow
      '\u001b[34;1m', // blue
      '\u001b[30;1m' // grey (bright black)
    ][index]
    const cyan = '\u001b[36m'
    const reset = '\u001b[0m'
    entry = `${emoji} ${colour}${label}${reset} ${cyan}${tag}${reset} ${message}`
    if (level === LogLevel.error) entry += '\n  ' + stack
  } else {
    entry = JSON.stringify({ time: new Date().toISOString(), ...data })
  }
  console.error(entry)
}

// Enable the default handler if there no other handler
// already enabled e.g. by another package using `logga`
if (!process.listenerCount(LOG_EVENT_NAME)) addHandler(defaultHandler)

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
