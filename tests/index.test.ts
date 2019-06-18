import { getLogger, addHandler, LogData, LogLevel } from '../src'

test('logga', () => {
  const TAG = __filename
  const log = getLogger(TAG)

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
  expect(events[0].tag).toBe(TAG)
  expect(events[0].level).toBe(LogLevel.debug)
  expect(events[0].message).toBe('a debug message')
  expect(events[0].stack).toMatch(/^Error:/)

  log.info({
    message: 'a info message',
    stack: 'Just a made up trace'
  })
  expect(consoleError).toHaveBeenCalledWith(
    __filename + ' - [INFO] - a info message'
  )
  expect(events.length).toBe(2)
  expect(events[1].tag).toBe(TAG)
  expect(events[1].level).toBe(LogLevel.info)
  expect(events[1].message).toBe('a info message')
  expect(events[1].stack).toBe('Just a made up trace')

  log.warn('a warning message')
  expect(events[2].level).toBe(LogLevel.warn)

  log.error('an error message')
  expect(events[3].level).toBe(LogLevel.error)
})
