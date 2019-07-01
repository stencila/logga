/**
 * This test checks that when stderr is not a TTY that
 * log data gets output as JSON with an additional
 * `time` property. It needs to be run like this:
 *
 * ```bash
 * npx ts-node untty.test.ts 2>log.json
 * ```
 *
 * This test doesn't use Jest because Jest writes to stderr,
 * thereby interfering with the log output.
 */

import * as fs from 'fs'
import { getLogger } from './index'

// Write some log data
const log = getLogger('logga:untty')
log.debug('a debug message')
log.info('an info message')
log.warn('a warning message')
log.error('an error message')

// Ensure the log file is flushed...
process.stderr.write('', () => {
  // Read in the log lines...
  fs.readFile('log.json', 'utf8', (err, lines) => {
    if (err) throw err

    const data = lines
      .split('\n')
      .filter(line => line.length > 0)
      .map(line => JSON.parse(line))
    const [debug, info, warn, error] = data

    // So some adhoc checks that the data is correct
    if (
      debug.time &&
      info.time &&
      warn.time &&
      error.time &&
      debug.level === 3 &&
      error.level === 0 &&
      error.message === 'an error message'
    ) {
      process.exit(0)
    } else {
      throw new Error(`Test failed with: ` + JSON.stringify(data, null, 2))
    }
  })
})
