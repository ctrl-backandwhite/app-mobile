import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { Session } from '../entities/session'
import { SocialAuthGateway } from '../ports/social-auth-gateway'
import { SignInWithGoogle } from '../usecases/sign-in-with-google'
import { aUser, FakeSessionStorage } from '../testing/fake-auth-repository'

function gatewayThatReturns(result: unknown): SocialAuthGateway {
  return { signInWithGoogle: jest.fn().mockResolvedValue(result) }
}

const SESSION: Session = { accessToken: 'a', refreshToken: 'r', user: aUser({ displayName: 'Ana' }) }

describe('SignInWithGoogle', () => {
  it('guarda los tokens y devuelve la sesión completa', async () => {
    const storage = new FakeSessionStorage()
    const useCase = new SignInWithGoogle(gatewayThatReturns(ok(SESSION)), storage)

    const result = await useCase.execute()

    expect(result).toEqual({ ok: true, value: SESSION })
    expect(await storage.load()).toEqual({ accessToken: 'a', refreshToken: 'r' })
  })

  it('no deja rastro de sesión cuando el acceso se cancela', async () => {
    const storage = new FakeSessionStorage()
    const useCase = new SignInWithGoogle(
      gatewayThatReturns(err(new AppError('CANCELLED', 'cancelado'))),
      storage,
    )

    const result = await useCase.execute()

    expect(result.ok).toBe(false)
    expect(await storage.load()).toBeNull()
  })

  it('propaga el motivo del rechazo', async () => {
    const useCase = new SignInWithGoogle(
      gatewayThatReturns(err(new AppError('CONFLICT', 'hay que vincular la cuenta'))),
      new FakeSessionStorage(),
    )

    const result = await useCase.execute()

    expect(!result.ok && result.error.code).toBe('CONFLICT')
  })
})
