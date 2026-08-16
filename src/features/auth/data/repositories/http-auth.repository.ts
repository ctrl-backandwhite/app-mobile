import { CaptchaSolver } from '@core/captcha/captcha-solver'
import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { Credentials, RegisterInput } from '@features/auth/domain/entities/credentials'
import { Session } from '@features/auth/domain/entities/session'
import { User } from '@features/auth/domain/entities/user'
import { AuthRepository } from '@features/auth/domain/ports/auth-repository'

import { loginDto, registerDto, userDto } from '../dto/auth.dto'
import { toUser } from '../mappers/user.mapper'

/** Zod señala sus fallos con este nombre; comprobarlo evita acoplarse a la clase concreta. */
function isSchemaViolation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

export class HttpAuthRepository implements AuthRepository {
  constructor(
    private readonly http: HttpClient,
    private readonly captcha: CaptchaSolver,
  ) {}

  /**
   * Envuelve una llamada al backend: traduce cualquier fallo a `AppError` y valida el contrato.
   * Una respuesta que no cumple el esquema se convierte en un error `CONTRACT` explícito en lugar
   * de un valor incompleto que reventaría más adelante.
   */
  private async call<T>(
    operation: () => Promise<unknown>,
    parse: (raw: unknown) => T,
  ): Promise<Result<T, AppError>> {
    try {
      return ok(parse(await operation()))
    } catch (error) {
      if (isSchemaViolation(error)) {
        return err(new AppError('CONTRACT', 'La respuesta del servidor no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  /** Los formularios públicos exigen la prueba de trabajo del CAPTCHA en la cabecera X-Altcha. */
  private async callWithCaptcha(path: string, body: unknown): Promise<Result<void, AppError>> {
    try {
      const altcha = await this.captcha.solve()
      await this.http.post(path, body, { headers: { 'X-Altcha': altcha } })
      return ok(undefined)
    } catch (error) {
      return err(mapHttpError(error))
    }
  }

  async signIn(credentials: Credentials): Promise<Result<Session, AppError>> {
    return this.call(
      () =>
        this.http.post('/auth/login', {
          email: credentials.email,
          password: credentials.password,
          linkSocial: credentials.linkSocial ?? false,
          otp: credentials.otp,
        }),
      (raw) => {
        const dto = loginDto.parse(raw)
        return { accessToken: dto.token, refreshToken: dto.refreshToken, user: toUser(dto.user) }
      },
    )
  }

  async currentUser(): Promise<Result<User, AppError>> {
    return this.call(
      () => this.http.get('/me'),
      (raw) => toUser(userDto.parse(raw)),
    )
  }

  async signOut(): Promise<Result<void, AppError>> {
    return this.call(
      () => this.http.post('/auth/logout'),
      () => undefined,
    )
  }

  async register(input: RegisterInput): Promise<Result<string, AppError>> {
    try {
      const altcha = await this.captcha.solve()
      const raw = await this.http.post('/auth/register', input, { headers: { 'X-Altcha': altcha } })
      return ok(registerDto.parse(raw).userId)
    } catch (error) {
      if (isSchemaViolation(error)) {
        return err(new AppError('CONTRACT', 'La respuesta del servidor no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async activate(code: string): Promise<Result<void, AppError>> {
    return this.call(
      () => this.http.post('/auth/activate', { code }),
      () => undefined,
    )
  }

  async resendActivation(email: string): Promise<Result<void, AppError>> {
    return this.callWithCaptcha('/auth/activate/resend', { email })
  }

  async requestPasswordReset(email: string): Promise<Result<void, AppError>> {
    return this.callWithCaptcha('/auth/password-reset/request', { email })
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<Result<void, AppError>> {
    return this.call(
      () => this.http.post('/auth/password-reset/confirm', { token, newPassword }),
      () => undefined,
    )
  }
}
