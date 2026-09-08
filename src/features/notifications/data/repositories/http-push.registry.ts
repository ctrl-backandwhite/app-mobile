import { AppError } from '@core/errors/app-error'
import { call } from '@core/http/call'
import { HttpClient } from '@core/http/http-client'
import { Result } from '@core/result/result'
import { PushDevice, PushRegistry } from '@features/notifications/domain/ports/push-registry'

export class HttpPushRegistry implements PushRegistry {
  constructor(private readonly http: HttpClient) {}

  async register(device: PushDevice): Promise<Result<void, AppError>> {
    return call(
      () => this.http.post('/me/devices', { token: device.token, platform: device.platform }),
      () => undefined,
    )
  }

  async unregister(token: string): Promise<Result<void, AppError>> {
    return call(
      () => this.http.delete(`/me/devices/${encodeURIComponent(token)}`),
      () => undefined,
    )
  }
}
