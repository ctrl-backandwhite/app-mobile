type Level = 'debug' | 'info' | 'warn' | 'error'

/** En una compilación de producción solo se emiten los errores; el resto es ruido para el usuario. */
const VERBOSE = typeof __DEV__ === 'undefined' ? false : __DEV__

function emit(level: Level, message: string, meta?: unknown): void {
  if (!VERBOSE && level !== 'error') return
  const line = `::> [${level.toUpperCase()}] ${message}`
  if (level === 'error') console.error(line, meta ?? '')
  else if (level === 'warn') console.warn(line, meta ?? '')
  else console.log(line, meta ?? '')
}

export const logger = {
  debug: (message: string, meta?: unknown): void => emit('debug', message, meta),
  info: (message: string, meta?: unknown): void => emit('info', message, meta),
  warn: (message: string, meta?: unknown): void => emit('warn', message, meta),
  error: (message: string, meta?: unknown): void => emit('error', message, meta),
}
