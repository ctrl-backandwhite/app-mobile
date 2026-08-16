import { act, fireEvent, screen, waitFor } from '@testing-library/react-native'
import * as Linking from 'expo-linking'

import { AppError } from '@core/errors/app-error'
import { resetIncomingLinks, startCapturingIncomingLinks } from '@core/linking/incoming-link'
import { err, ok } from '@core/result/result'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { AuthCallbackScreen } from '../screens/AuthCallbackScreen'
import { useSessionStore } from '../state/session.store'
import { renderWithContainer } from '../testing/render-with-container'

jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}))

const linking = Linking as jest.Mocked<typeof Linking>

const SESSION = { accessToken: 'a', refreshToken: 'r', user: aUser({ displayName: 'Ana' }) }

/**
 * Entrega el enlace como lo hace el sistema en el caso real: ANTES de que la pantalla se monte.
 *
 * Esta es la reproducción del fallo. Android emite el evento una sola vez, expo-router lo consume
 * para navegar y la pantalla llega después. Si la escucha viviera en la pantalla, aquí ya no habría
 * nada que oír y la espera sería eterna.
 */
function elSistemaEntrega(url: string): void {
  startCapturingIncomingLinks()
  const handler = linking.addEventListener.mock.calls.at(-1)?.[1] as (e: { url: string }) => void
  handler({ url })
}

describe('AuthCallbackScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetIncomingLinks()
    linking.addEventListener.mockReturnValue({ remove: jest.fn() } as never)
    linking.getInitialURL.mockResolvedValue(null)
    useSessionStore.setState({ user: null, status: 'anonymous', accessToken: null, refreshToken: null })
  })

  it('completa el acceso con un enlace que llegó antes de que la pantalla existiera', async () => {
    elSistemaEntrega('nx036://auth/callback#token=acceso&refresh=renovacion')
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
    // entrega SU enlace. Tomarlo por bueno dejaba la pantalla esperando una sesión que venía en otro.
    elSistemaEntrega('nx036://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081')
    const completeSocialLogin = { execute: jest.fn() }
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: completeSocialLogin as never })

    expect(await screen.findByText('Completando el acceso…')).toBeTruthy()
    expect(completeSocialLogin.execute).not.toHaveBeenCalled()
  })

  it('explica que la cuenta pide vincularse con la contraseña', async () => {
    elSistemaEntrega('nx036://auth/callback?link=required')
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: { execute: jest.fn() } as never })

    expect(await screen.findByText(/quedará vinculada/)).toBeTruthy()
  })

  it('explica el rechazo por verificación en dos pasos', async () => {
    elSistemaEntrega('nx036://auth/callback?error=2fa_required')
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: { execute: jest.fn() } as never })

    expect(await screen.findByText(/dos pasos/)).toBeTruthy()
  })

  it('muestra el fallo si el token no sirve, sin dejar sesión a medias', async () => {
    elSistemaEntrega('nx036://auth/callback#token=malo&refresh=malo')
    const completeSocialLogin = {
      execute: jest.fn().mockResolvedValue(err(new AppError('INVALID_CREDENTIALS', 'Token no válido'))),
    }
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: completeSocialLogin as never })

    expect(await screen.findByText('Token no válido')).toBeTruthy()
    expect(useSessionStore.getState().status).toBe('anonymous')
  })

  it('ofrece volver al acceso cuando algo falla', async () => {
    elSistemaEntrega('nx036://auth/callback?error=google')
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: { execute: jest.fn() } as never })

    const volver = await screen.findByText('Volver al acceso')
    await fireEvent.press(volver)

    expect(global.routerMock.replace).toHaveBeenCalledWith('/login')
  })

  it('no deja el indicador girando para siempre si el enlace nunca llega', async () => {
    // Sin esta salida, quien se identifica correctamente pero pierde el enlace por el camino se
    // queda mirando una pantalla que no avanza y sin nada que pulsar.
    jest.useFakeTimers()
    try {
      await renderWithContainer(<AuthCallbackScreen />, {
        completeSocialLogin: { execute: jest.fn() } as never,
      })
      expect(screen.getByText('Completando el acceso…')).toBeTruthy()

      await act(async () => {
        jest.advanceTimersByTime(6000)
      })

      expect(screen.getByText('El acceso no ha devuelto una sesión. Vuelve a intentarlo.')).toBeTruthy()
    } finally {
      jest.useRealTimers()
    }
  })

  it('avisa si el intercambio de tokens revienta en lugar de devolver un fallo', async () => {
    elSistemaEntrega('nx036://auth/callback#token=a&refresh=b')
    const completeSocialLogin = { execute: jest.fn().mockRejectedValue(new Error('sin red')) }
    await renderWithContainer(<AuthCallbackScreen />, { completeSocialLogin: completeSocialLogin as never })

    expect(await screen.findByText('No se ha podido completar el acceso.')).toBeTruthy()
    expect(useSessionStore.getState().status).toBe('anonymous')
  })
})
