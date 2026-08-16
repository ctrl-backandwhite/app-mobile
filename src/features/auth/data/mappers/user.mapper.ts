import { User } from '@features/auth/domain/entities/user'

import { UserDto } from '../dto/auth.dto'

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
    displayName: dto.displayName,
    firstName: dto.firstName,
    fullName: dto.fullName,
    companyName: dto.companyName,
    country: dto.country,
    language: dto.language,
    avatarUrl: dto.avatarUrl,
    createdAt: dto.createdAt,
    lastLogin: dto.lastLogin,
    authorities: dto.authorities,
  }
}
