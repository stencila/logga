var root =
  typeof window !== 'undefined'
    ? window
    : typeof global !== 'undefined'
    ? global
    : {}

function Logga() {
  const name = '_logga'
  if (name in root) {
    // @ts-ignore
    return root[name]
  }
  // @ts-ignore
  root[name] = []
  // @ts-ignore
  return root[name]
}

const logga: LogHandler[] = Logga()

/**
 * The severity level of a log event.
 */
export enum LogLevel {
  error = 0,
  warn,
  info,
  debug,
}

/**
 * Information supplied to the logger
 * about a log event.
 */
export interface LogEvent {
  message?: string
  stack?: string
}

/**
 * Data associated with a log event
 */
export interface LogData {
  tag: string
  level: LogLevel
  message: string
  stack?: string
}

/**
 * A log event emitter
 */
export interface Logger {
  error(message: string | LogEvent): void
  warn(message: string | LogEvent): void
  info(message: string | LogEvent): void
  debug(message: string | LogEvent): void
}

/**
 * A log event handler
 */
export interface LogHandler {
  (data: LogData): void
}

/**
 * Take a message `string`, or `LogInfo` object,
 * and emit an event with a `LogData` object.
 *
 * @param info
 * @param level
 */
function emitLogData(
  info: LogEvent | string,
  tag: string,
  level: LogLevel
): void {
  let message =
    typeof info === 'string'
      ? info
      : typeof info === 'object'
      ? info?.message ?? ''
      : ''

  let stack = typeof info === 'object' ? info?.stack : undefined

  const data: LogData = { tag, level, message, stack }

  for (const handler of logga) {
    handler(data)
  }
}

/**
 * Get all handlers.
 */
export function handlers(): LogHandler[] {
  return logga
}

/**
 * Add a handler.
 *
 * @param handler A function that handles the log data.
 * @param filter Options for filtering log data prior to sending to the handler.
 * @param filter.tags A list of tags that the log data should match.
 * @param filter.maxLevel The maximum log level.
 * @param filter.messageRegex A regex that the log message should match.
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
  logga.push(listener)
  return listener
}

/**
 * Remove a handler.
 *
 * @param handler The handler function to remove.
 */
export function removeHandler(handler: LogHandler): void {
  const index = logga.indexOf(handler)
  if (index > -1) logga.splice(index, 1)
}

/**
 * Remove all handlers.
 */
export function removeHandlers(): void {
  logga.splice(0, logga.length)
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
 * Escape a string for inclusion in JSON.
 *
 * Based on the list at https://www.json.org minus the backspace character (U+0008)
 *
 * @param value The string to escape
 */
function escape(value: string): string {
  return value !== undefined
    ? value.replace(/\"|\\|\/|\f|\n|\r|\t/g, (char) => {
        switch (char) {
          case '"':
            return '"'
          case '\\':
            return '\\\\'
          case '/':
            return '\\/'
          case '\f':
            return '\\f'
          case '\n':
            return '\\n'
          case '\r':
            return '\\r'
          case '\t':
            return '\\t'
        }
        return char
      })
    : value
}

/**
 * Default log event handler.
 *
 * Prints the event data to stderr:
 *
 * - with cutesy emoji, colours and stack (for errors) if stderr is TTY (for human consumption)
 * - as JSON if stderr is not TTY (for machine consumption e.g. log files)
 *
 * If in Node.js, and the
 *
 * @param data The log data to handle
 * @param options.maxLevel The maximum log level to print. Defaults to `info`.
 * @param options.showStack Whether or not to show any stack traces for errors. Defaults to `false`.
 * @param options.exitOnError Whether or not to exit the process on the first error. Defaults to `true`.
 * @param options.throttle.signature The log event signature to use for throttling. Defaults to '' (i.e. all events)
 * @param options.throttle.duration The duration for throttling (milliseconds). Defaults to 1000ms
 */
export function defaultHandler(
  data: LogData,
  options: {
    maxLevel?: LogLevel
    fastTime?: boolean
    showStack?: boolean
    exitOnError?: boolean
    throttle?: {
      signature?: string
      duration?: number
    }
  } = {}
): void {
  const { tag, level, message, stack } = data

  // Skip if greater than desired reporting level
  const { maxLevel = LogLevel.info } = options
  if (level > maxLevel) return

  // Skip if within throttling duration for the event signature
  const { throttle } = options
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
  if (
    typeof process !== 'undefined' &&
    process.stderr !== undefined &&
    process.stderr.isTTY !== true
  ) {
    const { fastTime = false } = options
    let json = `{"time":${
      fastTime ? Date.now() : `"${new Date().toISOString()}"`
    },"tag":"${tag}","level":${level},"message":"${message}"`
    if (stack !== undefined) {
      json += `,"stack":"${escape(stack)}"`
    }
    json += '}\n'
    process.stderr.write(json)
  } else {
    const index = level < 0 ? 0 : level > 3 ? 3 : level
    const label = LogLevel[index].toUpperCase().padEnd(5, ' ')
    let line
    /* istanbul ignore next */
    if (typeof window !== 'undefined') {
      line = `${label} ${tag} ${message}`
    } else {
      const emoji = [
        '🚨', // error
        '⚠', // warn
        '🛈', // info
        '🐛', // debug
      ][index]
      const colour = [
        '\u001b[31;1m', // red
        '\u001b[33;1m', // yellow
        '\u001b[34;1m', // blue
        '\u001b[30;1m', // grey (bright black)
      ][index]
      const cyan = '\u001b[36m'
      const reset = '\u001b[0m'
      line = `${emoji} ${colour}${label}${reset} ${cyan}${tag}${reset} ${message}`
    }

    const { showStack = false } = options
    if (showStack && stack !== undefined) line += '\n  ' + stack

    console.error(line)
  }

  const { exitOnError = true } = options
  if (
    typeof process !== 'undefined' &&
    exitOnError &&
    level === LogLevel.error
  ) {
    // Optional call to avoid exception if process does not have an exit method
    // See https://github.com/stencila/logga/issues/68#issuecomment-710114596
    process.exit?.(1)
  }
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
export function getLogger(tag: string): Logger {
  return {
    error(message: string | LogEvent) {
      emitLogData(message, tag, LogLevel.error)
    },
    warn(message: string | LogEvent) {
      emitLogData(message, tag, LogLevel.warn)
    },
    info(message: string | LogEvent) {
      emitLogData(message, tag, LogLevel.info)
    },
    debug(message: string | LogEvent) {
      emitLogData(message, tag, LogLevel.debug)
    },
  }
}
