export type UserRole = 'ADMIN' | 'OPERATOR' | 'PARTNER' | 'USER'

export interface User {
  readonly id: string
  readonly email: string
  readonly role: UserRole
  readonly active: boolean
  readonly displayName?: string
  readonly firstName?: string
  readonly fullName?: string
  readonly companyName?: string
  readonly country?: string
  readonly language?: string
  readonly avatarUrl?: string
  readonly createdAt: string
  readonly lastLogin?: string
  readonly authorities: readonly string[]
}

/** El back-office no se sirve desde la aplicación: el personal interno entra por el escritorio. */
export function isStaff(user: User): boolean {
  return user.role === 'ADMIN' || user.role === 'OPERATOR'
}

/** Nombre con el que saludar, con degradación ordenada hasta el correo. */
export function greetingNameOf(user: User): string {
  return user.displayName || user.firstName || user.fullName || user.email
}
