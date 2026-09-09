import { User } from '@features/auth/domain/entities/user'

import { UserDto } from '../dto/auth.dto'

/**
 * Lo que no viene se queda ausente, venga como venga.
 *
 * <p>El backend expresa «no hay dato» de dos formas —omitiendo el campo o mandándolo como `null`— y el
 * dominio solo entiende una: ausente. Sin esta traducción, un `null` viajaría hasta las pantallas y
 * saldría pintado como texto vacío donde debería no haber línea.
 */
function texto(valor?: string | null): string | undefined {
  return valor ?? undefined
}

/**
 * Traduce el usuario del backend a la entidad del dominio. Es una copia campo a campo hoy, pero el
 * paso existe para que un cambio de nombre en la API no se filtre hasta las pantallas.
 */
export function toUser(dto: UserDto): User {
  return {
    id: dto.id,
    email: dto.email,
    role: dto.role,
    active: dto.active,
    displayName: texto(dto.displayName),
    firstName: texto(dto.firstName),
    fullName: texto(dto.fullName),
    companyName: texto(dto.companyName),
    country: texto(dto.country),
    language: texto(dto.language),
    avatarUrl: texto(dto.avatarUrl),
    createdAt: dto.createdAt,
    lastLogin: texto(dto.lastLogin),
    authorities: dto.authorities,
  }
}
