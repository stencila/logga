import { LogHandler } from './index'

declare global {
  namespace NodeJS {
    interface Global {
      _logga?: LogHandler[]
    }
  }

  interface Window {
    _logga?: LogHandler[]
  }
}
