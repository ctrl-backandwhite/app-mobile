import { screen, waitFor } from '@testing-library/react-native'
import * as Linking from 'expo-linking'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { AuthCallbackScreen } from '../screens/AuthCallbackScreen'
import { useSessionStore } from '../state/session.store'
import { renderWithContainer } from '../testing/render-with-container'

jest.mock('expo-linking', () => ({
  useURL: jest.fn(),
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}))

const linking = Linking as jest.Mocked<typeof Linking>

const SESSION = { accessToken: 'a', refreshToken: 'r', user: aUser({ displayName: 'Ana' }) }

function conEnlace(url: string | null): void {
  linking.useURL.mockReturnValue(url)
  linking.getInitialURL.mockResolvedValue(url ?? null)
}

describe('AuthCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    linking.addEventListener.mockReturnValue({ remove: jest.fn() } as never)
    useSessionStore.setState({ user: null, status: 'anonymous', accessToken: null, refreshToken: null })
  })

  it('completa el acceso con los tokens del enlace y entra', async () => {
    conEnlace('nx036://auth/callback#token=acceso&refresh=renovacion')
    const completeSocialLogin = { execute: jest.fn().mockResolvedValue(ok(SESSION)) }
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: completeSocialLogin as never })

    await waitFor(() =>
      expect(completeSocialLogin.execute).toHaveBeenCalledWith('acceso', 'renovacion'),
    )
    await waitFor(() => expect(useSessionStore.getState().status).toBe('authenticated'))
    expect(global.routerMock.replace).toHaveBeenCalledWith('/')
  })

  it('ignora el enlace del cliente de desarrollo y espera al de verdad', async () => {
    // En una compilación de desarrollo la aplicación se abre a través del cliente de Expo, que
    // devuelve SU enlace. Tomarlo por bueno dejaba la pantalla esperando una sesión que venía en
    // otro enlace.
    conEnlace('nx036://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081')
    const completeSocialLogin = { execute: jest.fn() }
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: completeSocialLogin as never })

    expect(await screen.findByText('Completando el acceso…')).toBeTruthy()
    expect(completeSocialLogin.execute).not.toHaveBeenCalled()
  })

  it('explica que la cuenta pide vincularse con la contraseña', async () => {
    conEnlace('nx036://auth/callback?link=required')
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: { execute: jest.fn() } as never })

    expect(await screen.findByText(/quedará vinculada/)).toBeTruthy()
  })

  it('explica el rechazo por verificación en dos pasos', async () => {
    conEnlace('nx036://auth/callback?error=2fa_required')
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: { execute: jest.fn() } as never })

    expect(await screen.findByText(/dos pasos/)).toBeTruthy()
  })

  it('muestra el fallo si el token no sirve, sin dejar sesión a medias', async () => {
    conEnlace('nx036://auth/callback#token=malo&refresh=malo')
    const completeSocialLogin = {
      execute: jest.fn().mockResolvedValue(err(new AppError('INVALID_CREDENTIALS', 'Token no válido'))),
    }
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: completeSocialLogin as never })

    expect(await screen.findByText('Token no válido')).toBeTruthy()
    expect(useSessionStore.getState().status).toBe('anonymous')
  })

  it('ofrece volver al acceso cuando algo falla', async () => {
    conEnlace('nx036://auth/callback?error=google')
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: { execute: jest.fn() } as never })

    expect(await screen.findByText('Volver al acceso')).toBeTruthy()
  })
})
