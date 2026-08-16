import * as WebBrowser from 'expo-web-browser'

import { AppError, AppErrorCode } from '@core/errors/app-error'
import { logger } from '@core/logger/logger'
import { err, ok, Result } from '@core/result/result'
import { Session } from '@features/auth/domain/entities/session'
import { AuthRepository } from '@features/auth/domain/ports/auth-repository'
import { SocialAuthGateway } from '@features/auth/domain/ports/social-auth-gateway'

/** Enlace profundo que el backend tiene configurado como destino de esta aplicación. */
const CALLBACK_URL = 'nx036://auth/callback'

/**
 * Motivos con los que el backend puede rechazar un acceso social. Llegan como código en la URL de
 * vuelta, no como mensaje: al no haber respuesta HTTP que traducir, el texto lo pone la aplicación.
 */
interface Rejection {
  code: AppErrorCode
  message: string
}

const GENERIC_REJECTION: Rejection = {
  code: 'UNKNOWN',
  message: 'No se ha podido completar el acceso con Google.',
}

const REJECTIONS: Record<string, Rejection> = {
  google_email_unverified: {
    code: 'VALIDATION',
    message: 'Google no ha confirmado que ese correo sea tuyo. Verifícalo y vuelve a intentarlo.',
  },
  google_no_email: {
    code: 'VALIDATION',
    message: 'Tu cuenta de Google no ha compartido un correo con el que identificarte.',
  },
  '2fa_required': {
    code: 'MFA_REQUIRED',
    message: 'Tu cuenta tiene verificación en dos pasos: entra con tu correo y contraseña.',
  },
  google: GENERIC_REJECTION,
}

const LINK_REQUIRED: AppError = new AppError(
  'CONFLICT',
  'Ya existe una cuenta con ese correo. Entra con tu contraseña una vez y quedará vinculada a Google.',
)

const CANCELLED: AppError = new AppError('CANCELLED', 'Has cancelado el acceso con Google.')

/**
 * Acceso con Google usando la vista de navegador del sistema.
 *
 * No se usa una vista web incrustada a propósito: Google las rechaza desde 2021 y, además, una vista
 * propia podría leer las credenciales que la persona teclea. La del sistema está aislada de la
 * aplicación y comparte la sesión del navegador, así que quien ya tiene la cuenta abierta no vuelve a
 * escribir la contraseña.
 *
 * El parámetro `client=mobile` le dice al backend a cuál de sus destinos configurados debe devolver el
 * resultado; nunca se le envía una dirección.
 */
export class ExpoGoogleAuthGateway implements SocialAuthGateway {
  constructor(
    private readonly apiBaseUrl: string,
    private readonly authRepository: AuthRepository,
  ) {}

  async signInWithGoogle(): Promise<Result<Session, AppError>> {
    const authUrl = `${this.apiBaseUrl}/oauth2/authorization/google?client=mobile`

    let result: WebBrowser.WebBrowserAuthSessionResult
    try {
      result = await WebBrowser.openAuthSessionAsync(authUrl, CALLBACK_URL)
    } catch (error) {
      logger.warn('No se pudo abrir el navegador para el acceso con Google', error)
      return err(new AppError('UNKNOWN', 'No se ha podido abrir el acceso con Google.'))
    }

    // Cerrar la pestaña o pulsar atrás no es un fallo: es una decisión de la persona usuaria.
    if (result.type !== 'success') return err(CANCELLED)

    return this.completeFrom(result.url)
  }

  /** Interpreta la URL de vuelta y, si trae tokens, los canjea por el perfil. */
  private async completeFrom(returnedUrl: string): Promise<Result<Session, AppError>> {
    const rejection = this.rejectionIn(returnedUrl)
    if (rejection) return err(rejection)

    const tokens = this.tokensIn(returnedUrl)
    if (!tokens) {
      return err(new AppError('CONTRACT', 'La respuesta del acceso con Google no tiene el formato esperado.'))
    }

    // El backend devuelve tokens pero no el perfil, así que hay que pedirlo. Se hace con el token
    // recién emitido y de forma explícita: todavía no es la sesión activa de la aplicación.
    const user = await this.authRepository.currentUser(tokens.accessToken)
    if (!user.ok) return err(user.error)
    return ok({ ...tokens, user: user.value })
  }

  private rejectionIn(url: string): AppError | null {
    if (url.includes('link=required')) return LINK_REQUIRED
    const error = /[?&]error=([^&#]+)/.exec(url)?.[1]
    if (!error) return null
    // Un motivo desconocido no puede quedar en silencio: se explica en genérico.
    const known = REJECTIONS[decodeURIComponent(error)] ?? GENERIC_REJECTION
    return new AppError(known.code, known.message)
  }

  /** Los tokens viajan en el fragmento para que no queden en registros ni historiales. */
  private tokensIn(url: string): { accessToken: string; refreshToken: string } | null {
    const fragment = url.split('#')[1]
    if (!fragment) return null
    const params = new URLSearchParams(fragment)
    const accessToken = params.get('token')
    const refreshToken = params.get('refresh')
    if (!accessToken || !refreshToken) return null
    return { accessToken, refreshToken }
  }
}
