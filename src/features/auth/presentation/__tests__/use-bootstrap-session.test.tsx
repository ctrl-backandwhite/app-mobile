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

/** Nada guardado: es el arranque de una instalación recién hecha. */
const SIN_PREFERENCIAS = { execute: jest.fn().mockResolvedValue({ locale: null, currency: null }) }

async function mount(container: Partial<Container>): Promise<void> {
  await render(
    <ContainerProvider
      config={CONFIG}
      value={{ loadPreferences: SIN_PREFERENCIAS, ...container } as Container}
    >
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

  /**
   * El idioma y la divisa se aplican antes de pedir el perfil porque el cliente HTTP los lee del
   * almacén de sesión para componer cada petición: aplicarlos después haría salir la primera lectura
   * con los valores por defecto y cambiaría los precios delante de quien mira.
   */
  it('aplica el idioma y la divisa guardados ANTES de restaurar', async () => {
    const vistos: string[] = []

    await mount({
      loadPreferences: {
        execute: jest.fn().mockResolvedValue({ locale: 'fr', currency: 'EUR' }),
      } as never,
      sessionStorage: { load: jest.fn().mockResolvedValue(null), save: jest.fn(), clear: jest.fn() },
      restoreSession: {
        execute: jest.fn(async () => {
          const { locale, currency } = useSessionStore.getState()
          vistos.push(`${locale}/${currency}`)
          return ok(null)
        }),
      } as never,
    })

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
    expect(vistos).toEqual(['fr/EUR'])
  })

  /**
   * Un almacén de preferencias ilegible NO puede impedir entrar. Antes de blindarlo, la promesa del
   * arranque se rompía en la lectura y la aplicación se quedaba en «cargando» para siempre: ni
   * restauraba la sesión ni se declaraba anónima, así que ni siquiera aparecía la pantalla de acceso.
   */
  it('arranca aunque el almacén de preferencias falle', async () => {
    await mount({
      loadPreferences: {
        execute: jest.fn().mockRejectedValue(new Error('almacén ilegible')),
      } as never,
      sessionStorage: { load: jest.fn().mockResolvedValue(null), save: jest.fn(), clear: jest.fn() },
      restoreSession: { execute: jest.fn().mockResolvedValue(ok(null)) } as never,
    })

    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
  })
})
