import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderResult } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  defaultCurrency: 'EUR',
  defaultLocale: 'es',
}

/**
 * Monta una pantalla de la compra con sus dos proveedores.
 *
 * El cliente de consultas se crea nuevo en cada prueba y sin reintentos: compartirlo dejaría que la
 * caché de una prueba contaminara la siguiente, y los reintentos harían que un caso de error tardara
 * segundos en fallar.
 *
 * `deps` se inyecta como contenedor completo porque las pantallas leen de él tanto los casos de uso
 * de la compra como los de la cesta.
 */
export async function renderCheckout(
  ui: ReactElement,
  deps: Record<string, unknown> = {},
): Promise<RenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <ContainerProvider config={CONFIG} value={deps as unknown as Container}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ContainerProvider>,
  )
}
