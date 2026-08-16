import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderResult } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'

import { OrdersUseCases } from '../hooks/use-orders-use-cases'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  defaultCurrency: 'EUR',
  defaultLocale: 'es',
}

/**
 * Monta una pantalla del histórico con sus dos proveedores.
 *
 * El cliente de consultas se crea nuevo en cada prueba y sin reintentos: compartirlo dejaría que la
 * caché de una prueba contaminara la siguiente, y los reintentos harían que un caso de error tardara
 * segundos en fallar.
 */
export async function renderOrders(
  ui: ReactElement,
  overrides: Partial<OrdersUseCases> = {},
): Promise<RenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    <ContainerProvider config={CONFIG} value={overrides as Container}>
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
    </ContainerProvider>,
  )
}
