/**
 * Lo que el cliente HTTP necesita saber de la sesión, expresado como puerto.
 *
 * Sin esto, `core/http` tendría que importar la feature de autenticación y la infraestructura
 * pasaría a depender de una funcionalidad concreta. La implementación real la aporta el contenedor
 * de dependencias.
 *
 * Los captadores son síncronos a propósito: el interceptor de peticiones no puede esperar a una
 * lectura del almacén cifrado, así que los tokens vivos se mantienen en memoria.
 */
export interface SessionBridge {
  getAccessToken(): string | null
  getRefreshToken(): string | null
  onRefreshed(accessToken: string, refreshToken: string): void
  onExpired(): void
  getCountry(): string | null
  getLocale(): string
  getCurrency(): string
}
