import { getLogger, addLogHandler, LogData } from '../src'

test('getLogger', () => {
  const log = getLogger(__filename)
  log.info('an informational message')
  log.error({ message: 'an error message' })
})

test('addLogHandler', () => {
  const log = getLogger(__filename)

  const consoleLog = jest.spyOn(console, 'log')
  addLogHandler()
  log.warning('Beep boop')
  expect(consoleLog).toHaveBeenCalledWith(__filename + ': Beep boop')

  let last: LogData
  const handler = (name, data) => {
    last = data
  }
  addLogHandler(handler)

  log.warning({ message: 'a warning !!' })
  //expect(last.level).toBe('warning')
  expect(last.message).toBe('a warning !!')
})
