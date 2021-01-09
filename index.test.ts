import {
  addHandler,
  getLogger,
  LogData,
  LogLevel,
  removeHandler,
  removeHandlers,
  replaceHandlers,
  defaultHandler,
} from './index'

test('logging', () => {
  const TAG = 'tests:logging'
  const log = getLogger(TAG)

  const events: LogData[] = []
  replaceHandlers((data) => events.push(data))

  log.debug('a debug message')
  expect(events.length).toBe(1)
  expect(events[0].tag).toBe(TAG)
  expect(events[0].level).toBe(LogLevel.debug)
  expect(events[0].message).toBe('a debug message')
  expect(events[0].stack).toBeUndefined()

  log.info({
    message: 'an info message',
    stack: 'Just a made up trace',
  })
  expect(events.length).toBe(2)
  expect(events[1].tag).toBe(TAG)
  expect(events[1].level).toBe(LogLevel.info)
  expect(events[1].message).toBe('an info message')
  expect(events[1].stack).toBe('Just a made up trace')

  log.warn('a warning message')
  expect(events[2].level).toBe(LogLevel.warn)

  let error = new Error('an error message')
  log.error(error)
  expect(events[3].level).toBe(LogLevel.error)
  expect(events[3].stack).toMatch(/^Error:/)
  // Second line (first call stack) in stack trace should be this file
  // @ts-ignore
  expect(events[3].stack.split('\n')[1]).toMatch(/\/index\.test\.ts/)
})

test('TTY', () => {
  const log = getLogger('tests:tty')
  replaceHandlers((data) => defaultHandler(data, { exitOnError: false }))

  // Fake that we are using a TTY device
  process.stderr.isTTY = true
  const consoleError = jest.spyOn(console, 'error')

  log.error('an error message')

  expect(consoleError).toHaveBeenCalledWith(
    expect.stringMatching(/ERROR(.*)?an error message/)
  )
})

test('non-TTY', () => {
  const log = getLogger('tests:non-tty')
  replaceHandlers((data) => defaultHandler(data, { exitOnError: false }))

  // Fake that we are using a non-TTY device
  // @ts-ignore
  process.stderr.isTTY = false
  const consoleError = jest.spyOn(console, 'error')

  let error = new Error('an error message')
  log.error(error)

  const json = consoleError.mock.calls[consoleError.mock.calls.length - 1][0]
  const data = JSON.parse(json)
  expect(data.time).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  expect(data.level).toBe(0)
  expect(data.message).toBe('an error message')
  expect(data.stack).toBeTruthy()
})

test('adding and removing handlers', () => {
  const log = getLogger('tests:handlers')
  const consoleError = jest.spyOn(console, 'error')
  const consoleErrorCalls = consoleError.mock.calls.length
  const events: LogData[] = []

  // Add and remove handlers using different APIs...

  const first = (data: LogData) => events.push(data)
  replaceHandlers(first)
  log.info('')
  expect(events.length).toBe(1)

  const second = (data: LogData) => events.push(data)
  addHandler(second)
  log.info('')
  expect(events.length).toBe(3)

  const third = addHandler((data: LogData) => events.push(data))
  log.info('')
  expect(events.length).toBe(6)

  removeHandler(third)
  log.info('')
  expect(events.length).toBe(8)

  removeHandlers()
  log.info('')
  expect(events.length).toBe(8)

  // Because started with `replaceHandlers` there should be
  // no more logging to console
  expect(consoleError.mock.calls.length).toBe(consoleErrorCalls)
})

test('adding a handler with filter options', () => {
  const log1 = getLogger('log1')
  const log2 = getLogger('log2')
  removeHandlers()

  let lastMessage
  const recordMessage = (logData: LogData) => (lastMessage = logData.message)

  // No filter
  const handler1 = addHandler(recordMessage)
  log1.debug('A')
  expect(lastMessage).toBe('A')
  removeHandler(handler1)

  // tags filter
  const handler2 = addHandler(recordMessage, { tags: ['log1'] })
  log1.debug('B')
  log2.debug('C')
  expect(lastMessage).toBe('B')
  removeHandler(handler2)

  // maxLevel filter
  const handler3 = addHandler(recordMessage, { maxLevel: LogLevel.error })
  log1.error('D')
  log1.debug('E')
  expect(lastMessage).toBe('D')
  removeHandler(handler3)

  // messageRegex filter
  const handler4 = addHandler(recordMessage, { messageRegex: /^F$/ })
  log1.debug('F')
  log1.debug('f')
  log1.debug('')
  log1.debug(' FF')
  expect(lastMessage).toBe('F')
  removeHandler(handler4)

  // func filter
  const handler5 = addHandler(recordMessage, {
    func: (logData: LogData): boolean =>
      logData.level === LogLevel.debug && logData.message.startsWith('G'),
  })
  log1.debug('G')
  log1.debug('g')
  log1.error('Goof')
  expect(lastMessage).toBe('G')
  removeHandler(handler5)

  // All the filters together
  const handler6 = addHandler(recordMessage, {
    tags: ['log2'],
    maxLevel: LogLevel.warn,
    messageRegex: /^H/,
    func: (logData: LogData): boolean => logData.message.endsWith('!'),
  })
  log2.warn('Hello world!')
  log2.debug('Help!')
  log1.error('Hello woof!')
  expect(lastMessage).toBe('Hello world!')
  removeHandler(handler6)
})

test('defaultHandler:maxLevel', () => {
  const log = getLogger('logger')

  const consoleError = jest.spyOn(console, 'error')
  const callsStart = consoleError.mock.calls.length

  log.debug('a debug message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 0)

  replaceHandlers((data) => defaultHandler(data, { maxLevel: LogLevel.debug }))
  log.debug('a debug message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 1)

  replaceHandlers((data) => defaultHandler(data, { maxLevel: LogLevel.warn }))
  log.debug('a debug message')
  log.warn('a warn message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 2)

  removeHandlers()
})

test('defaultHandler:throttle', async () => {
  const log = getLogger('logger')

  const consoleError = jest.spyOn(console, 'error')
  const callsStart = consoleError.mock.calls.length

  replaceHandlers((data) =>
    defaultHandler(data, {
      exitOnError: false,
      throttle: { signature: '${message}', duration: 200 },
    })
  )

  log.error('a message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 1)

  log.error('a message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 1)

  await new Promise((resolve) => setTimeout(resolve, 300))

  log.error('a message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 2)

  log.error('a different message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 3)

  removeHandlers()
})
