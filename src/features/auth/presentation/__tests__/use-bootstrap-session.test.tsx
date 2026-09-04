import { render, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'

import { AppError } from '@core/errors/app-error'
import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'
import { err, ok } from '@core/result/result'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { useBootstrapSession } from '../hooks/use-bootstrap-session'
import { useSessionStore } from '../state/session.store'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  webBaseUrl: 'https://nx036.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

function Probe(): React.ReactElement {
  useBootstrapSession()
  return <Text>listo</Text>
}

async function mount(container: Partial<Container>): Promise<void> {
  await render(
    <ContainerProvider config={CONFIG} value={container as Container}>
      <Probe />
    </ContainerProvider>,
  )
}

describe('useBootstrapSession', () => {
  beforeEach(() => {
    useSessionStore.setState({
      user: null,
      status: 'loading',
      accessToken: null,
      refreshToken: null,
    })
  })

  it('queda anónimo cuando no hay sesión guardada', async () => {
    await mount({
      sessionStorage: { load: jest.fn().mockResolvedValue(null), save: jest.fn(), clear: jest.fn() },
      restoreSession: { execute: jest.fn().mockResolvedValue(ok(null)) } as never,
    })

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
  })

  it('publica los tokens guardados ANTES de pedir el perfil', async () => {
    const order: string[] = []
    const stored = { accessToken: 'a', refreshToken: 'r' }
    const user = aUser({ displayName: 'Ana' })

    await mount({
      sessionStorage: {
        load: jest.fn(async () => {
          order.push('load')
          return stored
        }),
        save: jest.fn(),
        clear: jest.fn(),
      },
      restoreSession: {
        execute: jest.fn(async () => {
          // Si los tokens no estuvieran ya en memoria, la petición del perfil saldría sin cabecera
          // de autorización y el backend la rechazaría con un 401.
          order.push(`execute(token=${useSessionStore.getState().accessToken})`)
          return ok({ ...stored, user })
        }),
      } as never,
    })

    await waitFor(() => expect(useSessionStore.getState().status).toBe('authenticated'))
    expect(order).toEqual(['load', 'execute(token=a)'])
    expect(useSessionStore.getState().user?.displayName).toBe('Ana')
  })

  it('queda anónimo cuando los tokens guardados ya no valen', async () => {
    await mount({
      sessionStorage: {
        load: jest.fn().mockResolvedValue({ accessToken: 'viejo', refreshToken: 'viejo' }),
        save: jest.fn(),
        clear: jest.fn(),
      },
      restoreSession: { execute: jest.fn().mockResolvedValue(ok(null)) } as never,
    })

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
  })

  it('queda anónimo si la restauración falla', async () => {
    await mount({
      sessionStorage: {
        load: jest.fn().mockResolvedValue({ accessToken: 'a', refreshToken: 'r' }),
        save: jest.fn(),
        clear: jest.fn(),
      },
      restoreSession: {
        execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
      } as never,
    })

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
  })
})
