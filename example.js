/**
 * Example usage to generate example outputs.
 *
 * For pretty output run using,
 *
 * ```bash
 * node example.js
 * ```
 *
 * For machine readable output run using,
 *
 * ```bash
 * node example.js 2> log.json
 * ```
 */

const { getLogger } = require('./dist')

const log = getLogger('example')

log.debug('This is line five.')
log.info('Everything is just fine.')
log.warn('Oh, oh, not no much.')
log.error('Aaargh, an error!')

try {
  throw new Error('I am an error object.')
} catch (error) {
  const { message, stack } = error
  log.error({
    message: 'Woaaah something bad happened! ' + message,
    stack
  })
}
