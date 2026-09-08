import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { PlatformNotification } from '../entities/notification'
import { NotificationsRepository } from '../ports/notifications-repository'

export class ListNotifications {
  constructor(private readonly repository: NotificationsRepository) {}

  execute(): Promise<Result<PlatformNotification[], AppError>> {
    return this.repository.inbox()
  }
}

export class MarkNotificationRead {
  constructor(private readonly repository: NotificationsRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    const identificador = id.trim()
    if (identificador.length === 0) {
      return err(new AppError('VALIDATION', 'No se sabe qué aviso marcar.'))
    }
    return this.repository.markRead(identificador)
  }
}

export class MarkAllNotificationsRead {
  constructor(private readonly repository: NotificationsRepository) {}

  execute(): Promise<Result<void, AppError>> {
    return this.repository.markAllRead()
  }
}

/**
 * Archivar saca el aviso de la bandeja sin borrarlo.
 *
 * <p>La app no ofrece papelera ni borrado definitivo a propósito: en un teléfono, un gesto de más
 * sobre una lista es un borrado accidental, y lo archivado se recupera desde el escritorio.
 */
export class ArchiveNotification {
  constructor(private readonly repository: NotificationsRepository) {}

  async execute(id: string): Promise<Result<void, AppError>> {
    const identificador = id.trim()
    if (identificador.length === 0) {
      return err(new AppError('VALIDATION', 'No se sabe qué aviso archivar.'))
    }
    return this.repository.archive(identificador)
  }
}
