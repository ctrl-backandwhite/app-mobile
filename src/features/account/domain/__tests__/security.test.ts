import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { ActiveSession } from '../entities/active-session'
import { AccountRepository } from '../ports/account-repository'
import { ChangePassword } from '../usecases/change-password'
import {
  ConfirmAccountDeletion,
  RequestAccountDeletion,
} from '../usecases/delete-account'
import { ListSessions, RevokeSession } from '../usecases/sessions'

const BUENA = 'Abcdef1!'

function repositorio(overrides: Partial<AccountRepository> = {}): AccountRepository {
  return {
    changePassword: jest.fn().mockResolvedValue(ok(undefined)),
    sessions: jest.fn().mockResolvedValue(ok([])),
    revokeSession: jest.fn().mockResolvedValue(ok(undefined)),
    requestDeletion: jest.fn().mockResolvedValue(ok(undefined)),
    confirmDeletion: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  }
}

describe('ChangePassword', () => {
  it('manda las dos contraseñas al backend', async () => {
    const changePassword = jest.fn().mockResolvedValue(ok(undefined))

    const result = await new ChangePassword(repositorio({ changePassword })).execute('Vieja1!x', BUENA)

    expect(result.ok).toBe(true)
    expect(changePassword).toHaveBeenCalledWith('Vieja1!x', BUENA)
  })

  it('exige la contraseña actual', async () => {
    const result = await new ChangePassword(repositorio()).execute('', BUENA)

    expect(!result.ok && result.error.code).toBe('VALIDATION')
  })

  /**
   * La misma política que en el alta. Si aquí fuera más laxa, cambiar la contraseña sería la manera
   * de saltarse los requisitos del registro.
   */
  it('aplica la política del alta a la nueva', async () => {
    const changePassword = jest.fn()

    const result = await new ChangePassword(repositorio({ changePassword })).execute('Vieja1!x', 'corta')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(changePassword).not.toHaveBeenCalled()
  })

  it('no deja repetir la que ya se tenía', async () => {
    const result = await new ChangePassword(repositorio()).execute(BUENA, BUENA)

    expect(!result.ok && result.error.code).toBe('VALIDATION')
  })

  it('propaga el fallo del backend', async () => {
    const result = await new ChangePassword(
      repositorio({
        changePassword: jest.fn().mockResolvedValue(err(new AppError('INVALID_CREDENTIALS', 'no coincide'))),
      }),
    ).execute('Vieja1!x', BUENA)

    expect(!result.ok && result.error.code).toBe('INVALID_CREDENTIALS')
  })
})

describe('ListSessions', () => {
  it('devuelve las sesiones abiertas', async () => {
    const sesiones: ActiveSession[] = [
      {
        id: 's-1',
        device: 'Pixel 8',
        ip: '10.0.0.1',
        createdAt: '2026-09-01T10:00:00Z',
        lastSeenAt: '2026-09-06T10:00:00Z',
        current: true,
      },
    ]
    const result: Result<ActiveSession[], AppError> = await new ListSessions(
      repositorio({ sessions: jest.fn().mockResolvedValue(ok(sesiones)) }),
    ).execute()

    expect(result.ok && result.value).toEqual(sesiones)
  })
})

describe('RevokeSession', () => {
  it('cierra la sesión pedida', async () => {
    const revokeSession = jest.fn().mockResolvedValue(ok(undefined))

    await new RevokeSession(repositorio({ revokeSession })).execute(' s-2 ')

    expect(revokeSession).toHaveBeenCalledWith('s-2')
  })

  it('no llama al backend sin identificador', async () => {
    const revokeSession = jest.fn()

    const result = await new RevokeSession(repositorio({ revokeSession })).execute('   ')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(revokeSession).not.toHaveBeenCalled()
  })
})

describe('borrado de cuenta', () => {
  it('el primer paso solo pide el código', async () => {
    const requestDeletion = jest.fn().mockResolvedValue(ok(undefined))

    await new RequestAccountDeletion(repositorio({ requestDeletion })).execute()

    expect(requestDeletion).toHaveBeenCalled()
  })

  it('el segundo paso manda el código sin espacios', async () => {
    const confirmDeletion = jest.fn().mockResolvedValue(ok(undefined))

    await new ConfirmAccountDeletion(repositorio({ confirmDeletion })).execute(' 123456 ')

    expect(confirmDeletion).toHaveBeenCalledWith('123456')
  })

  /** Sin código no se llama al backend: un borrado con el campo vacío sería un 400 y un susto. */
  it('no confirma sin código', async () => {
    const confirmDeletion = jest.fn()

    const result = await new ConfirmAccountDeletion(repositorio({ confirmDeletion })).execute('')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(confirmDeletion).not.toHaveBeenCalled()
  })
})
