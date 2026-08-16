import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

/**
 * Cliente HTTP con el backend simulado, para las pruebas de los repositorios de la compra.
 *
 * Vive fuera de `__tests__` porque el `testMatch` de jest-expo trata como suite cualquier fichero
 * bajo esa carpeta, y un módulo sin `it` rompe la ejecución.
 */
export function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'EUR',
  })
  return { client, mock: new MockAdapter(client.raw) }
}
