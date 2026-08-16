import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'

import { AppConfig } from '@core/config/env'

import { Container } from '../container'
import { ContainerProvider, useContainer } from '../container.provider'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

function Probe(): React.ReactElement {
  const container = useContainer()
  return <Text>{container.http ? 'con contenedor' : 'sin contenedor'}</Text>
}

describe('ContainerProvider', () => {
  it('publica el contenedor al árbol', async () => {
    await render(
      <ContainerProvider config={CONFIG} value={{ http: {} } as Container}>
        <Probe />
      </ContainerProvider>,
    )

    expect(screen.getByText('con contenedor')).toBeTruthy()
  })

  it('construye un contenedor real cuando no se le pasa uno', async () => {
    await render(
      <ContainerProvider config={CONFIG}>
        <Probe />
      </ContainerProvider>,
    )

    expect(screen.getByText('con contenedor')).toBeTruthy()
  })
})
