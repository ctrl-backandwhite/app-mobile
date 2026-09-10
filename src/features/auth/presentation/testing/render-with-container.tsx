import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, RenderResult } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { Container } from '@composition/container'
import { AppConfig } from '@core/config/env'
import { withSafeArea } from '@shared/testing/safe-area'

import { ContainerProvider } from '@composition/container.provider'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  webBaseUrl: 'https://nx036.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

/**
 * Monta una pantalla con los casos de uso sustituidos por dobles.
 *
 * La pantalla recibe el contenedor completo, así que basta con dar los casos de uso que la prueba
 * ejerce; el resto queda sin definir y cualquier uso accidental salta como error en lugar de pasar
 * desapercibido. Esta es la ventaja concreta de inyectar dependencias en lugar de importarlas.
 *
 * Alrededor van el cliente de consultas y el área segura porque las pantallas de acceso ya no son
 * solo campos: el registro pide al servidor los países y los idiomas y los enseña en una hoja. Sin
 * ellos la pantalla revienta al montarse, no al usarse. El cliente es nuevo en cada prueba y sin
 * reintentos: compartirlo dejaría que la caché de una contaminara a la siguiente.
 */
export async function renderWithContainer(
  ui: ReactElement,
  overrides: Partial<Container> = {},
): Promise<RenderResult> {
  const container = overrides as Container
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  })

  return render(
    withSafeArea(
      <ContainerProvider config={CONFIG} value={container}>
        <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
      </ContainerProvider>,
    ),
  )
}
