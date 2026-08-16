import { SecretStore } from '@core/storage/ports'
import { StoredSession } from '@features/auth/domain/entities/session'
import { SessionStorage } from '@features/auth/domain/ports/session-storage'

const ACCESS_KEY = 'nx036.accessToken'
const REFRESH_KEY = 'nx036.refreshToken'

/**
 * Guarda el par de tokens en el almacén cifrado del dispositivo. El perfil no se persiste: se
 * recarga con /me al arrancar, así un cambio de rol o de país surte efecto sin reinstalar nada.
 */
export class SecureSessionStorage implements SessionStorage {
  constructor(private readonly secrets: SecretStore) {}

  async load(): Promise<StoredSession | null> {
    const [accessToken, refreshToken] = await Promise.all([
      this.secrets.get(ACCESS_KEY),
      this.secrets.get(REFRESH_KEY),
    ])
    // Media sesión no es sesión: sin el token de renovación, el acceso caducado sería un callejón
    // sin salida.
    if (!accessToken || !refreshToken) return null
    return { accessToken, refreshToken }
  }

  async save(session: StoredSession): Promise<void> {
    await Promise.all([
      this.secrets.set(ACCESS_KEY, session.accessToken),
      this.secrets.set(REFRESH_KEY, session.refreshToken),
    ])
  }

  async clear(): Promise<void> {
    await Promise.all([this.secrets.remove(ACCESS_KEY), this.secrets.remove(REFRESH_KEY)])
  }
}
