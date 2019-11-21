/* global CustomEvent */

const LOG_EVENT_NAME = 'stencila:logga'

/**
 * The global log event bus from which all events are emitted
 * and handlers are attached.
 *
 * When in Node, exposes the event API of Node `process`.
 * When in a browser, creates adaptor functions to mimic the
 * Node API using `window` event handling functions.
 */
let bus: {
  emit: (event: string, data: LogData) => void
  listeners: (event: string) => LogHandler[]
  addListener: (event: string, handler: LogHandler) => void
  removeListener: (event: string, handler: LogHandler) => void
  removeAllListeners: (event: string) => void
}
if (typeof process !== 'undefined') {
  bus = {
    /* eslint-disable @typescript-eslint/unbound-method */
    emit: process.emit as typeof bus.emit,
    listeners: process.listeners as typeof bus.listeners,
    addListener: process.addListener as typeof bus.addListener,
    removeListener: process.removeListener,
    removeAllListeners: process.removeAllListeners
    /* eslint-enable @typescript-eslint/unbound-method */
  }
}
/* istanbul ignore next */
if (typeof window !== 'undefined') {
  /**
   * To mimic the Node event API in the browser it is necessary to:
   *
   * - wrap `LogData` in a `CustomEvent` when emitting an event and
   *   unwrap it when handling an event
   * - maintain a list of event listeners (`window` does not expose
   *   that for us)
   * - use a map of handlers to listeners so that we can remove them
   */
  type CustomEventListener = (customEvent: CustomEvent<LogData>) => void
  const listeners = new Map<LogHandler, CustomEventListener>()
  bus = {
    emit: (event: string, data: LogData) => {
      window.dispatchEvent(
        new CustomEvent<LogData>(event, { detail: data })
      )
    },
    listeners: () => {
      return Array.from(listeners.keys())
    },
    addListener: (event: string, handler: LogHandler) => {
      const listener = (customEvent: CustomEvent<LogData>): void =>
        handler(customEvent.detail)
      // @ts-ignore
      window.addEventListener(event, listener)
      listeners.set(handler, listener)
    },
    removeListener: (event: string, handler: LogHandler) => {
      const listener = listeners.get(handler)
      if (listener === undefined) return
      // @ts-ignore
      window.removeEventListener(event, listener)
      listeners.delete(handler)
    },
    removeAllListeners: (event: string) => {
      Array.from(listeners.values()).map(listener => {
        // @ts-ignore
        window.removeEventListener(event, listener)
      })
      listeners.clear()
    }
  }
}

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
  stack?: string
}

/**
 * A listener for the log event must have this function signature.
 */
export interface LogHandler {
  (data: LogData): void
}

/**
 * Take a message `string`, or `LogInfo` object,
 * and emit an event with a `LogData` object.
 *
 * For `LogLevel.error`, if `LogInfo` does not have a `stack`,
 * one is generated and set on the `LogData`.
 *
 * @param info
 * @param level
 */
function emitLogData(
  info: LogInfo | string,
  tag: string,
  level: LogLevel
): void {
  let message = ''
  if (typeof info === 'object' && info.message !== undefined) {
    message = info.message
  } else if (typeof info === 'string') {
    message = info
  }

  const data: LogData = { tag, level, message }

  if (typeof info === 'object' && info.stack !== undefined) {
    data.stack = info.stack
  } else if (level <= LogLevel.error) {
    const error = new Error()
    if (error.stack !== undefined) {
      // Remove the first three lines of the stack trace which
      // are not useful (see issue #3)
      const lines = error.stack.split('\n')
      data.stack = [lines[0], ...lines.slice(3)].join('\n')
    }
  }
  bus.emit(LOG_EVENT_NAME, data)
}

/**
 * Get all handlers.
 */
export function handlers(): LogHandler[] {
  return bus.listeners(LOG_EVENT_NAME)
}

/**
 * Add a handler.
 *
 * @param handler A function that handles the log data.
 * @param filter Options for filtering log data prior to sending to the handler.
 * @param filter.tags A list of tags that the log data should match.
 * @param filter.maxLevel The maximum log level.
 * @param filter.messageRegex A regex that the log level should match.
 * @param filter.func A function that determines if handler is called
 * @returns The handler function that was added.
 */
export function addHandler(
  handler: LogHandler,
  filter: {
    tags?: string[]
    maxLevel?: LogLevel
    messageRegex?: RegExp
    func?: (logData: LogData) => boolean
  } = {}
): LogHandler {
  let listener = handler
  const { tags, maxLevel, messageRegex, func } = filter
  if (
    tags !== undefined ||
    maxLevel !== undefined ||
    messageRegex !== undefined ||
    func !== undefined
  ) {
    listener = (logData: LogData) => {
      if (tags !== undefined && !tags.includes(logData.tag)) return
      if (maxLevel !== undefined && logData.level > maxLevel) return
      if (messageRegex !== undefined && !messageRegex.test(logData.message))
        return
      if (func !== undefined && !func(logData)) return
      handler(logData)
    }
  }
  bus.addListener(LOG_EVENT_NAME, listener)
  return listener
}

/**
 * Remove a handler.
 *
 * @param handler The handler function to remove.
 */
export function removeHandler(handler: LogHandler): void {
  bus.removeListener(LOG_EVENT_NAME, handler)
}

/**
 * Remove all handlers.
 */
export function removeHandlers(): void {
  bus.removeAllListeners(LOG_EVENT_NAME)
}

/**
 * Replace all existing handlers with a new handler.
 *
 * This is a convenience function that can be used to
 * replace the default handler with a new one which logs
 * to the console.
 */
export function replaceHandlers(handler: LogHandler): void {
  removeHandlers()
  addHandler(handler)
}

const defaultHandlerHistory = new Map<string, number>()

/**
 * Default log data handler.
 *
 * Prints the data to stderr:
 *
 * - with cutesy emoji, colours and stack (for errors) if stderr is TTY (for human consumption)
 * - as JSON if stderr is not TTY (for machine consumption e.g. log files)
 *
 * @param data The log data to handle
 * @param options.maxLevel The maximum log level to print. Defaults to `info`
 * @param options.throttle.signature The log event signature to use for throttling. Defaults to '' (i.e. all events)
 * @param options.throttle.duration The duration for throttling (milliseconds). Defaults to 1000ms
 */
export function defaultHandler(
  data: LogData,
  options?: {
    maxLevel?: LogLevel
    throttle?: {
      signature?: string
      duration?: number
    }
  }
): void {
  const { tag, level, message, stack } = data

  // Skip if greater than desired reporting level
  const maxLevel =
    options !== undefined && options.maxLevel !== undefined
      ? options.maxLevel
      : LogLevel.info
  if (level > maxLevel) return

  // Skip if within throttling duration for the event signature
  const throttle = options !== undefined ? options.throttle : undefined
  if (throttle !== undefined) {
    const signature = throttle.signature !== undefined ? throttle.signature : ''
    const eventSignature = signature
      .replace(/\${tag}/, tag)
      .replace(/\${level}/, level.toString())
      .replace(/\${message}/, message)
    const lastTime = defaultHandlerHistory.get(eventSignature)
    if (lastTime !== undefined) {
      const duration =
        throttle.duration !== undefined ? throttle.duration : 1000
      if (Date.now() - lastTime < duration) return
    }
    defaultHandlerHistory.set(eventSignature, Date.now())
  }

  // Generate a human readable or machine readable log entry based on
  // environment
  let entry = ''
  if (
    typeof process !== 'undefined' &&
    process.stderr !== undefined &&
    process.stderr.isTTY !== true
  ) {
    entry = JSON.stringify({ time: new Date().toISOString(), ...data })
  } else {
    const index = level < 0 ? 0 : level > 3 ? 3 : level
    const label = LogLevel[index].toUpperCase().padEnd(5, ' ')
    /* istanbul ignore next */
    if (typeof window !== 'undefined') {
      entry = `${label} ${tag} ${message}`
    } else {
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
    }
    if (stack !== undefined) entry += '\n  ' + stack
  }
  console.error(entry)
}

// Enable the default handler if there no other handler
// already enabled e.g. by another package using `logga`
if (handlers().length === 0) addHandler(defaultHandler)

/**
 * Get a logger for the specific application or package.
 *
 * Each of the returned logger functions are the public interface for
 * posting log messages.
 *
 * @param tag The unique application or package name
 */
// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
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
