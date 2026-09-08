import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { PlatformNotification } from '@features/notifications/domain/entities/notification'
import { NotificationsRepository } from '@features/notifications/domain/ports/notifications-repository'

import { NotificationDto, notificationsDto } from '../dto/notification.dto'

function toNotification(dto: NotificationDto): PlatformNotification {
  return {
    id: dto.id,
    title: dto.title ?? 'Aviso',
    body: dto.body ?? '',
    eventType: dto.eventType ?? '',
    // El backend no manda un booleano: manda CUÁNDO se leyó. Sin fecha, sin leer.
    read: Boolean(dto.readAt),
    createdAt: dto.createdAt ?? '',
  }
}

export class HttpNotificationsRepository implements NotificationsRepository {
  constructor(private readonly http: HttpClient) {}

  async inbox(): Promise<Result<PlatformNotification[], AppError>> {
    return call(
      () => this.http.get('/me/notifications', { params: { folder: 'inbox' } }),
      (raw) => notificationsDto.parse(raw ?? []).map(toNotification),
      'La lista de avisos no tiene el formato esperado.',
    )
  }

  async markRead(id: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post(`/me/notifications/${id}/read`),
      () => undefined,
    )
  }

  async markAllRead(): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/notifications/read-all'),
      () => undefined,
    )
  }

  async archive(id: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post(`/me/notifications/${id}/archive`),
      () => undefined,
    )
  }
}
