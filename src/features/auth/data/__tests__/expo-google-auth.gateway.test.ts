import * as WebBrowser from 'expo-web-browser'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { AuthRepository } from '@features/auth/domain/ports/auth-repository'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { ExpoGoogleAuthGateway } from '../repositories/expo-google-auth.gateway'

jest.mock('expo-web-browser', () => ({ openAuthSessionAsync: jest.fn() }))

const browser = WebBrowser as jest.Mocked<typeof WebBrowser>

const USER = aUser({ displayName: 'Ana' })

function repositoryThatReturns(result: unknown): AuthRepository {
  return { currentUser: jest.fn().mockResolvedValue(result) } as unknown as AuthRepository
}

function gateway(repository: AuthRepository = repositoryThatReturns(ok(USER))): ExpoGoogleAuthGateway {
  return new ExpoGoogleAuthGateway('https://api.test', repository)
}

function returns(url: string): void {
  browser.openAuthSessionAsync.mockResolvedValue({ type: 'success', url } as never)
}

describe('ExpoGoogleAuthGateway', () => {
  beforeEach(() => jest.clearAllMocks())

  it('abre el navegador del sistema identificándose como cliente móvil', async () => {
    returns('nx036://auth/callback#token=a&refresh=r')

    await gateway().signInWithGoogle()

    // El backend recibe un identificador de cliente, nunca una dirección: así no puede convertirse en
    // un redirector abierto.
    expect(browser.openAuthSessionAsync).toHaveBeenCalledWith(
      'https://api.test/oauth2/authorization/google?client=mobile',
      'nx036://auth/callback',
    )
  })

  it('devuelve la sesión con el perfil cuando el acceso se completa', async () => {
    returns('nx036://auth/callback#token=acceso&refresh=renovacion')
    const repository = repositoryThatReturns(ok(USER))

    const result = await gateway(repository).signInWithGoogle()

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.accessToken).toBe('acceso')
    expect(result.ok && result.value.refreshToken).toBe('renovacion')
    expect(result.ok && result.value.user.displayName).toBe('Ana')
    // El perfil se pide con el token recién emitido, que todavía no es la sesión activa.
    expect(repository.currentUser).toHaveBeenCalledWith('acceso')
  })

  it('trata la cancelación como tal y no como un fallo', async () => {
    browser.openAuthSessionAsync.mockResolvedValue({ type: 'cancel' } as never)

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('CANCELLED')
  })

  it('avisa de que la cuenta pide vinculación con la contraseña', async () => {
    returns('nx036://auth/callback?link=required')

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('CONFLICT')
    expect(!result.ok && result.error.message).toContain('contraseña')
  })

  it('explica que el segundo factor obliga a entrar con contraseña', async () => {
    returns('nx036://auth/callback?error=2fa_required')

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('MFA_REQUIRED')
  })

  it('explica el correo no verificado por el proveedor', async () => {
    returns('nx036://auth/callback?error=google_email_unverified')

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('VALIDATION')
  })

  it('no deja en silencio un motivo de rechazo desconocido', async () => {
    returns('nx036://auth/callback?error=algo_que_no_conocemos')

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('UNKNOWN')
    expect(!result.ok && result.error.message).toContain('Google')
  })

  it('falla con CONTRACT si la vuelta no trae los dos tokens', async () => {
    returns('nx036://auth/callback#token=solo-uno')

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('falla con CONTRACT si la vuelta no trae fragmento', async () => {
    returns('nx036://auth/callback')

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('propaga el fallo al recuperar el perfil', async () => {
    returns('nx036://auth/callback#token=a&refresh=r')
    const repository = repositoryThatReturns(err(new AppError('NETWORK', 'sin conexión')))

    const result = await gateway(repository).signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('sobrevive a que el navegador no se pueda abrir', async () => {
    browser.openAuthSessionAsync.mockRejectedValue(new Error('sin navegador'))

    const result = await gateway().signInWithGoogle()

    expect(!result.ok && result.error.code).toBe('UNKNOWN')
  })
})
