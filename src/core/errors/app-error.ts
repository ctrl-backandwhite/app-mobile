/**
 * Códigos estables con los que la aplicación razona sobre un fallo. El texto que ve la persona
 * usuaria lo traduce el backend; estos códigos son para decidir el comportamiento (pedir el segundo
 * factor, volver al paso anterior, reintentar…).
 */
export type AppErrorCode =
  | 'INVALID_CREDENTIALS'
  | 'MFA_REQUIRED'
  | 'MFA_INVALID'
  | 'RATE_LIMITED'
  | 'VALIDATION'
  | 'CAPTCHA_FAILED'
  | 'CANCELLED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'NETWORK'
  | 'SERVER'
  | 'CONTRACT'
  | 'UNKNOWN'

export class AppError extends Error {
  readonly code: AppErrorCode
  readonly status?: number

  constructor(code: AppErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    // Sin esto, `instanceof AppError` falla al compilar a ES5 porque Error rompe la cadena de
    // prototipos de las subclases.
    Object.setPrototypeOf(this, AppError.prototype)
  }
}
