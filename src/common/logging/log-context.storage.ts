import { AsyncLocalStorage } from 'async_hooks'
import { LogContext } from './log-context.interface'

export const logContextStorage = new AsyncLocalStorage<LogContext>()

export const getLogContext = (): LogContext | undefined => logContextStorage.getStore()
