import { getLogger, addHandler, LogData, LogLevel } from './index'

test('logga', () => {
  const TAG = 'logga:jest'
  const log = getLogger(TAG)

  // Will collect logs in this array
  let events: LogData[] = []
  addHandler(data => events.push(data))

  const consoleError = jest.spyOn(console, 'error')

  log.debug('a debug message')
  expect(consoleError).toHaveBeenCalledWith(
    expect.stringMatching(/DEBUG(.*)?a debug message/)
  )
  expect(events.length).toBe(1)
  expect(events[0].tag).toBe(TAG)
  expect(events[0].level).toBe(LogLevel.debug)
  expect(events[0].message).toBe('a debug message')
  expect(events[0].stack).toMatch(/^Error:/)
  // Second line (first call stack) in stack trace should be this file
  expect(events[0].stack.split('\n')[1]).toMatch(/logga\/index\.test\.ts/)

  log.info({
    message: 'an info message',
    stack: 'Just a made up trace'
  })
  expect(consoleError).toHaveBeenCalledWith(
    expect.stringMatching(/INFO(.*)?an info message/)
  )
  expect(events.length).toBe(2)
  expect(events[1].tag).toBe(TAG)
  expect(events[1].level).toBe(LogLevel.info)
  expect(events[1].message).toBe('an info message')
  expect(events[1].stack).toBe('Just a made up trace')

  log.warn('a warning message')
  expect(events[2].level).toBe(LogLevel.warn)

  log.error('an error message')
  expect(events[3].level).toBe(LogLevel.error)
})
