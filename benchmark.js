/**
 * Benchmarks comparing the speed of Logga to other Node.js logging frameworks
 *
 * All frameworks configured to log errors to `stderr`.
 * Build Logga if necessary before running benchmarks.
 * Best run by redireting `stderr` to `/dev/null` e.g.
 *
 * ```sh
 * npm run benchmark
 * ```
 */

const Benchmark = require('benchmark')

// Import each of the libraries used

const bole = require('bole')
const bunyan = require('bunyan')
const log4js = require('log4js')
const logga = require('.')
const loglevel = require('loglevel')
const pino = require('pino')
const winston = require('winston')

// Instantiate loggers for each library

const boleLogger = bole('bench')
bole
  .output({
    level: 'error',
    stream: process.stderr,
  })
  .setFastTime(true)

const bunyanLogger = bunyan.createLogger({
  name: 'bench',
  streams: [
    {
      level: 'error',
      stream: process.stderr,
    },
  ],
})

var log4jsLogger = log4js.getLogger()
log4jsLogger.level = 'error'
log4js.configure({
  appenders: { err: { type: 'stderr' } },
  categories: { default: { appenders: ['err'], level: 'ERROR' } },
})

const loggaLogger = logga.getLogger('bench')
logga.replaceHandlers((entry) => {
  logga.defaultHandler(entry, { fastTime: true, exitOnError: false })
})

const loglevelLogger = loglevel.getLogger('bench')
loglevelLogger.setLevel('error')

const pinoLogger = pino(process.stderr, { name: 'bench' })

const winstonLogger = winston.createLogger({
  transports: [
    new winston.transports.Stream({
      stream: process.stderr,
    }),
  ],
})

// Run the benchmark suites!

// A more precise benchmark for comparing performance
// across changes in code
new Benchmark.Suite()
  .add('logga', {
    minSamples: 500,
    fn: function () {
      loggaLogger.error({ msg: 'hello' })
    },
  })
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .run()

// For comparison with other libraries
new Benchmark.Suite()
  .add('bole', function () {
    boleLogger.error('derp')
  })
  .add('bunyan', function () {
    bunyanLogger.error('derp')
  })
  .add('logga', function () {
    loggaLogger.error('derp')
  })
  .add('log4js', function () {
    log4jsLogger.error('derp')
  })
  .add('loglevel', function () {
    loglevelLogger.error('derp')
  })
  .add('pino', function () {
    pinoLogger.error('derp')
  })
  .add('winston', function () {
    winstonLogger.error('derp')
  })
  .on('cycle', function (event) {
    console.log(String(event.target))
  })
  .on('complete', function () {
    console.log('Fastest is ' + this.filter('fastest').map('name'))
  })
  .run()
