import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { ActiveSession } from '../entities/active-session'

export interface AccountRepository {
  changePassword(current: string, next: string): Promise<Result<void, AppError>>
  sessions(): Promise<Result<ActiveSession[], AppError>>
  revokeSession(id: string): Promise<Result<void, AppError>>
  /** Pide el código de un solo uso que el backend manda al correo de la cuenta. */
  requestDeletion(): Promise<Result<void, AppError>>
  confirmDeletion(code: string): Promise<Result<void, AppError>>
}
