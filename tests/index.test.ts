import { getLogger, addHandler, LogData, LogLevel } from '../src'

test('logga', () => {
  const APPNAME = __filename
  const log = getLogger(APPNAME)

  // Will log to console.error
  addHandler()

  // Will collect logs in this array
  let events: LogData[] = []
  addHandler(data => events.push(data))

  const consoleError = jest.spyOn(console, 'error')

  log.debug('a debug message')
  expect(consoleError).toHaveBeenCalledWith(
    __filename + ' - [DEBUG] - a debug message'
  )
  expect(events.length).toBe(1)
  expect(events[0].appName).toBe(APPNAME)
  expect(events[0].level).toBe(LogLevel.debug)
  expect(events[0].message).toBe('a debug message')
  expect(events[0].stackTrace).toMatch(/^Error:/)

  log.info({
    message: 'a info message',
    stackTrace: 'Just a made up trace'
  })
  expect(consoleError).toHaveBeenCalledWith(
    __filename + ' - [INFO] - a info message'
  )
  expect(events.length).toBe(2)
  expect(events[1].appName).toBe(APPNAME)
  expect(events[1].level).toBe(LogLevel.info)
  expect(events[1].message).toBe('a info message')
  expect(events[1].stackTrace).toBe('Just a made up trace')

  log.warn('a warning message')
  expect(events[2].level).toBe(LogLevel.warn)

  log.error('an error message')
  expect(events[3].level).toBe(LogLevel.error)
})
