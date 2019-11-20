import {
  addHandler,
  getLogger,
  LogData,
  LogLevel,
  removeHandler,
  removeHandlers,
  replaceHandlers,
  defaultHandler
} from './index'

test('logging', () => {
  const TAG = 'tests:logging'
  const log = getLogger(TAG)

  const events: LogData[] = []
  addHandler(data => events.push(data))

  log.debug('a debug message')
  expect(events.length).toBe(1)
  expect(events[0].tag).toBe(TAG)
  expect(events[0].level).toBe(LogLevel.debug)
  expect(events[0].message).toBe('a debug message')
  expect(events[0].stack).toBeUndefined()

  log.info({
    message: 'an info message',
    stack: 'Just a made up trace'
  })
  expect(events.length).toBe(2)
  expect(events[1].tag).toBe(TAG)
  expect(events[1].level).toBe(LogLevel.info)
  expect(events[1].message).toBe('an info message')
  expect(events[1].stack).toBe('Just a made up trace')

  log.warn('a warning message')
  expect(events[2].level).toBe(LogLevel.warn)

  log.error('an error message')
  expect(events[3].level).toBe(LogLevel.error)
  expect(events[3].stack).toMatch(/^Error:/)
  // Second line (first call stack) in stack trace should be this file
  // @ts-ignore
  expect(events[3].stack.split('\n')[1]).toMatch(/logga\/index\.test\.ts/)
})

test('TTY', () => {
  const log = getLogger('tests:tty')

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

  // Fake that we are using a non-TTY device
  // @ts-ignore
  process.stderr.isTTY = false
  const consoleError = jest.spyOn(console, 'error')

  log.error('an error message')

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

test('defaultHandler:level', () => {
  const log = getLogger('logger')

  const consoleError = jest.spyOn(console, 'error')
  const callsStart = consoleError.mock.calls.length

  log.debug('a debug message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 0)

  replaceHandlers(data => defaultHandler(data, { level: LogLevel.debug }))
  log.debug('a debug message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 1)

  replaceHandlers(data => defaultHandler(data, { level: LogLevel.warn }))
  log.debug('a debug message')
  log.warn('a warn message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 2)

  removeHandlers()
})

test('defaultHandler:throttle', async () => {
  const log = getLogger('logger')

  const consoleError = jest.spyOn(console, 'error')
  const callsStart = consoleError.mock.calls.length

  replaceHandlers(data =>
    defaultHandler(data, {
      throttle: { signature: '${message}', duration: 200 }
    })
  )

  log.error('a message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 1)

  log.error('a message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 1)

  await new Promise(resolve => setTimeout(resolve, 300))

  log.error('a message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 2)

  log.error('a different message')
  expect(consoleError.mock.calls.length).toBe(callsStart + 3)

  removeHandlers()
})
