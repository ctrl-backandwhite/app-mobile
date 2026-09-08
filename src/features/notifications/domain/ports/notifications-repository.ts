import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { PlatformNotification } from '../entities/notification'

export interface NotificationsRepository {
  /** La bandeja de entrada, lo más reciente primero. Lo archivado y la papelera no se traen. */
  inbox(): Promise<Result<PlatformNotification[], AppError>>
  markRead(id: string): Promise<Result<void, AppError>>
  markAllRead(): Promise<Result<void, AppError>>
  archive(id: string): Promise<Result<void, AppError>>
}
