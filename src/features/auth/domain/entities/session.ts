import { User } from './user'

/** Par de tokens tal como los guarda el dispositivo. El perfil no se persiste: se recarga con /me. */
export interface StoredSession {
  readonly accessToken: string
  readonly refreshToken: string
}

export interface Session extends StoredSession {
  readonly user: User
}
