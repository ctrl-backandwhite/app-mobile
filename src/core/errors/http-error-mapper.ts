import { AxiosError } from 'axios'

import { AppError, AppErrorCode } from './app-error'

interface BackendErrorBody {
  code?: string
  message?: string
}

/**
 * Textos de reserva. Solo se usan cuando la respuesta no trae `message`: la localización de los
 * errores es responsabilidad del backend, que la resuelve con la cabecera X-Lang.
 */
const FALLBACK: Record<AppErrorCode, string> = {
  INVALID_CREDENTIALS: 'Correo o contraseña incorrectos.',
  MFA_REQUIRED: 'Introduce el código de verificación.',
  MFA_INVALID: 'El código de verificación no es válido.',
  RATE_LIMITED: 'Demasiados intentos. Inténtalo de nuevo en unos minutos.',
  VALIDATION: 'Revisa los datos introducidos.',
  CAPTCHA_FAILED: 'No se pudo completar la verificación de seguridad.',
  CANCELLED: 'Has cancelado la operación.',
  NOT_FOUND: 'No se ha encontrado el recurso solicitado.',
  CONFLICT: 'La operación entra en conflicto con el estado actual.',
  NETWORK: 'No hay conexión con el servidor.',
  SERVER: 'El servidor no ha podido completar la operación.',
  CONTRACT: 'La respuesta del servidor no tiene el formato esperado.',
  UNKNOWN: 'Se ha producido un error inesperado.',
}

function codeFor(status: number, body: BackendErrorBody): AppErrorCode {
  // El 401 del acceso es ambiguo: el segundo factor y las credenciales erróneas comparten estado,
  // y solo el código del cuerpo los distingue.
  if (status === 401) {
    if (body.code === 'MFA_REQUIRED' || body.code === 'MFA_INVALID') return body.code
    return 'INVALID_CREDENTIALS'
  }
  if (body.code === 'CAPTCHA_FAILED') return 'CAPTCHA_FAILED'
  if (status === 429) return 'RATE_LIMITED'
  if (status === 404) return 'NOT_FOUND'
  if (status === 409) return 'CONFLICT'
  if (status === 400 || status === 415 || status === 422) return 'VALIDATION'
  if (status >= 500) return 'SERVER'
  return 'UNKNOWN'
}

/** Traduce cualquier fallo de red o de HTTP al lenguaje de errores de la aplicación. */
export function mapHttpError(error: unknown): AppError {
  if (error instanceof AppError) return error

  if (error instanceof AxiosError) {
    // Sin respuesta no hubo servidor al otro lado: es un problema de red, no del backend.
    if (!error.response) return new AppError('NETWORK', FALLBACK.NETWORK)
    const body: BackendErrorBody = (error.response.data ?? {}) as BackendErrorBody
    const code = codeFor(error.response.status, body)
    return new AppError(code, body.message ?? FALLBACK[code], error.response.status)
  }

  return new AppError('UNKNOWN', FALLBACK.UNKNOWN)
}
