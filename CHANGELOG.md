# [3.0.0](https://github.com/stencila/logga/compare/v2.2.0...v3.0.0) (2020-09-01)


### Features

* **defaultHandler:** Exit on error option ([d5447a0](https://github.com/stencila/logga/commit/d5447a098f085df625f1b523402891aa7dffef3b))


### BREAKING CHANGES

* **defaultHandler:** Changes the default behaviour to exit the process on the first error logged.

# [2.2.0](https://github.com/stencila/logga/compare/v2.1.0...v2.2.0) (2020-04-21)


### Features

* **Build:** Create & publish modern JS builds ([032a0b2](https://github.com/stencila/logga/commit/032a0b2741c114b787219332fdc9bca6d0c9f0fb))

# [2.1.0](https://github.com/stencila/logga/compare/v2.0.0...v2.1.0) (2019-12-02)


### Features

* **Default handler:** Add showStack option ([0dc246e](https://github.com/stencila/logga/commit/0dc246e05627b9e93363b034dc6e487c7abc855f))

# [2.0.0](https://github.com/stencila/logga/compare/v1.4.1...v2.0.0) (2019-11-21)


### Code Refactoring

* **defaultHandler:** Change option name to `maxLevel` ([ca22dec](https://github.com/stencila/logga/commit/ca22dec84c3282369d974deaa311e884f85f8ef7))


### Features

* **addHandler:** Allow log event filters to be specified ([0f467b4](https://github.com/stencila/logga/commit/0f467b47676d62b0238b66f31238f1db4024dfd0))
* **addHandler:** Return the handler that was added. ([322c7d1](https://github.com/stencila/logga/commit/322c7d187ff190fb8841619b00bbb3b1a21d8984))


### BREAKING CHANGES

* **defaultHandler:** Made because `level` had caused some confusion amongst users of this library and to be consistent with the same option in `addHandler`.
* **addHandler:** Handler funtion is no longer optional for either `addHandler` or `removeHandler`. Used to default to `defaultHandler`.

## [1.4.1](https://github.com/stencila/logga/compare/v1.4.0...v1.4.1) (2019-11-10)


### Bug Fixes

* **Package:** Remove browser property of package.json ([fe7a7d8](https://github.com/stencila/logga/commit/fe7a7d8))

# [1.4.0](https://github.com/stencila/logga/compare/v1.3.0...v1.4.0) (2019-10-17)


### Bug Fixes

* Add missing argument ([ba36d3e](https://github.com/stencila/logga/commit/ba36d3e))


### Features

* **Browser:** Enable running in browser ([6664f68](https://github.com/stencila/logga/commit/6664f68))

# [1.3.0](https://github.com/stencila/logga/compare/v1.2.1...v1.3.0) (2019-09-03)


### Bug Fixes

* **Emit:** Only attach stack to errors ([9ef7b84](https://github.com/stencila/logga/commit/9ef7b84))


### Features

* **Throttling:** Allow for throttling of events in handler ([b11633a](https://github.com/stencila/logga/commit/b11633a))

## [1.2.1](https://github.com/stencila/logga/compare/v1.2.0...v1.2.1) (2019-07-03)


### Bug Fixes

* **Handlers:** Only add default handler if no other ([a462fc5](https://github.com/stencila/logga/commit/a462fc5))

# [1.2.0](https://github.com/stencila/logga/compare/v1.1.2...v1.2.0) (2019-07-02)


### Features

* **Default handler:** Improve default handler and always use it ([64b8620](https://github.com/stencila/logga/commit/64b8620))

## [1.1.2](https://github.com/stencila/logga/compare/v1.1.1...v1.1.2) (2019-06-18)


### Bug Fixes

* **Package:** Use @stencila/typescript-boilerplate and refactor ([aa9cd89](https://github.com/stencila/logga/commit/aa9cd89))
