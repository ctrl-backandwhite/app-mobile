import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Credentials, RegisterInput } from '../entities/credentials'
import { Session } from '../entities/session'
import { User } from '../entities/user'

export interface AuthRepository {
  signIn(credentials: Credentials): Promise<Result<Session, AppError>>
  /**
   * Perfil de la sesión actual. `accessToken` permite pedirlo con un token recién emitido que todavía
   * no está publicado como sesión activa, que es lo que ocurre al volver de un acceso social.
   */
  currentUser(accessToken?: string): Promise<Result<User, AppError>>
  signOut(): Promise<Result<void, AppError>>
  register(input: RegisterInput): Promise<Result<string, AppError>>
  activate(code: string): Promise<Result<void, AppError>>
  resendActivation(email: string): Promise<Result<void, AppError>>
  requestPasswordReset(email: string): Promise<Result<void, AppError>>
  confirmPasswordReset(token: string, newPassword: string): Promise<Result<void, AppError>>
}
