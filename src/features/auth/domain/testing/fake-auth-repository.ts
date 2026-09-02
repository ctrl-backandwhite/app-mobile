/**
 * Dobles del dominio, compartidos por las pruebas de esta feature y de las que la consumen.
 *
 * Viven fuera de `__tests__` porque el `testMatch` de jest-expo trata como suite cualquier fichero
 * bajo esa carpeta, y un módulo sin `it` rompe la ejecución.
 */
import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Credentials, RegisterInput } from '../entities/credentials'
import { Session, StoredSession } from '../entities/session'
import { User } from '../entities/user'
import { AuthRepository } from '../ports/auth-repository'
import { SessionStorage } from '../ports/session-storage'

export function aUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u-1',
    email: 'ana@nx036.com',
    role: 'USER',
    active: true,
    displayName: 'Ana',
    createdAt: '2026-01-01T00:00:00Z',
    authorities: ['ROLE_USER'],
    ...overrides,
  }
}

interface Config {
  session?: Session
  user?: User
  error?: AppError
}

export class FakeAuthRepository implements AuthRepository {
  lastCredentials: Credentials | null = null
  lastRegistration: RegisterInput | null = null
  signOutCalls = 0

  constructor(private readonly config: Config = {}) {}

  private fail<T>(): Result<T, AppError> {
    return err(this.config.error ?? new AppError('UNKNOWN', 'sin configurar'))
  }

  async signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
    this.lastCredentials = credentials
    return this.config.session ? ok(this.config.session) : this.fail<Session>()
  }

  async currentUser(): Promise<Result<User, AppError>> {
    const user = this.config.user ?? this.config.session?.user
    return user ? ok(user) : this.fail<User>()
  }

  async signOut(): Promise<Result<void, AppError>> {
    this.signOutCalls++
    return this.config.error ? this.fail<void>() : ok(undefined)
  }

  async register(input: RegisterInput): Promise<Result<string, AppError>> {
    this.lastRegistration = input
    return this.config.error ? this.fail<string>() : ok('u-nuevo')
  }

  async activate(): Promise<Result<void, AppError>> {
    return this.config.error ? this.fail<void>() : ok(undefined)
  }

  async resendActivation(): Promise<Result<void, AppError>> {
    return this.config.error ? this.fail<void>() : ok(undefined)
  }

  async requestPasswordReset(): Promise<Result<void, AppError>> {
    return this.config.error ? this.fail<void>() : ok(undefined)
  }

  async confirmPasswordReset(): Promise<Result<void, AppError>> {
    return this.config.error ? this.fail<void>() : ok(undefined)
  }
}

export class FakeSessionStorage implements SessionStorage {
  private stored: StoredSession | null = null

  async load(): Promise<StoredSession | null> {
    return this.stored
  }

  async save(session: StoredSession): Promise<void> {
    this.stored = session
  }

  async clear(): Promise<void> {
    this.stored = null
  }
}
