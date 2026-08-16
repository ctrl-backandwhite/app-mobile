import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Session } from '../entities/session'

/**
 * Acceso con una identidad de un tercero (hoy solo Google).
 *
 * El dominio no sabe que por debajo se abre una vista de navegador del sistema ni que la vuelta llega
 * por un enlace profundo: solo pide entrar y recibe una sesión o un error. Eso permite probar el caso
 * de uso sin navegador y cambiar el mecanismo —o añadir otro proveedor— sin tocarlo.
 */
export interface SocialAuthGateway {
  signInWithGoogle(): Promise<Result<Session, AppError>>
}
