import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderResult } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'
import { withSafeArea } from '@shared/testing/safe-area'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  webBaseUrl: 'https://nx036.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

/**
 * Monta una pantalla del catálogo con sus dos proveedores.
 *
 * El cliente de consultas se crea nuevo en cada prueba y sin reintentos: compartirlo dejaría que la
 * caché de una prueba contaminara la siguiente, y los reintentos harían que un caso de error tardara
 * segundos en fallar.
 */
/**
 * Casos de uso que cualquier pantalla del catálogo da por hechos.
 *
 * <p>La rejilla ofrece compra rápida y el distintivo de la pestaña se pone al día al añadir, así que
 * hasta una prueba que solo mira títulos los necesita montados. Se declaran aquí para que cada
 * prueba siga hablando únicamente de lo suyo; quien quiera afirmar sobre ellos los pisa por
 * `overrides`.
 */
function cesta(): Partial<Container> {
  return {
    addToCart: { execute: jest.fn().mockResolvedValue(undefined) },
    loadCart: { execute: jest.fn().mockResolvedValue([]) },
  } as unknown as Partial<Container>
}

export async function renderCatalog(
  ui: ReactElement,
  overrides: Partial<Container> = {},
): Promise<RenderResult> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  // El área segura la monta el layout raíz en la aplicación; aquí hace falta porque cualquier hoja
  // inferior pregunta por los márgenes del sistema y sin proveedor revienta al pintarse.
  return render(
    withSafeArea(
      <ContainerProvider config={CONFIG} value={{ ...cesta(), ...overrides } as Container}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </ContainerProvider>,
    ),
  )
}
