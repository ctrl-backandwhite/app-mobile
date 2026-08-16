import { render, RenderResult } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { Container } from '@composition/container'
import { AppConfig } from '@core/config/env'

import { ContainerProvider } from '@composition/container.provider'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

/**
 * Monta una pantalla con los casos de uso sustituidos por dobles.
 *
 * La pantalla recibe el contenedor completo, así que basta con dar los casos de uso que la prueba
 * ejerce; el resto queda sin definir y cualquier uso accidental salta como error en lugar de pasar
 * desapercibido. Esta es la ventaja concreta de inyectar dependencias en lugar de importarlas.
 */
export async function renderWithContainer(
  ui: ReactElement,
  overrides: Partial<Container> = {},
): Promise<RenderResult> {
  const container = overrides as Container
  return render(
    <ContainerProvider config={CONFIG} value={container}>
      {ui}
    </ContainerProvider>,
  )
}
