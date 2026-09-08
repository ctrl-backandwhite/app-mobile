import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { ActiveSession } from '@features/account/domain/entities/active-session'
import { AccountRepository } from '@features/account/domain/ports/account-repository'

import { ActiveSessionDto, activeSessionsDto } from '../dto/account.dto'

function toActiveSession(dto: ActiveSessionDto): ActiveSession {
  return {
    id: dto.id,
    device: dto.device ?? 'Dispositivo desconocido',
    ip: dto.ip ?? '',
    createdAt: dto.createdAt ?? '',
    lastSeenAt: dto.lastSeenAt ?? '',
    current: dto.current ?? false,
  }
}

export class HttpAccountRepository implements AccountRepository {
  constructor(private readonly http: HttpClient) {}

  async changePassword(current: string, next: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/password', { currentPassword: current, newPassword: next }),
      () => undefined,
    )
  }

  async sessions(): Promise<Result<ActiveSession[], AppError>> {
    return call(
      () => this.http.get('/me/sessions'),
      (raw) => activeSessionsDto.parse(raw ?? []).map(toActiveSession),
      'La lista de sesiones no tiene el formato esperado.',
    )
  }

  async revokeSession(id: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post(`/me/sessions/${id}/revoke`),
      () => undefined,
    )
  }

  async requestDeletion(): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/delete/request'),
      () => undefined,
    )
  }

  async confirmDeletion(code: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/delete/confirm', { code }),
      () => undefined,
    )
  }
}
