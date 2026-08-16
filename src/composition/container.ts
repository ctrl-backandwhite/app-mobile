import { AltchaCaptchaSolver, CaptchaSolver, Challenge } from '@core/captcha/captcha-solver'
import { AppConfig } from '@core/config/env'
import { HttpClient } from '@core/http/http-client'
import { SessionBridge } from '@core/http/session-bridge'
import { logger } from '@core/logger/logger'
import { ExpoSecretStore } from '@core/storage/secure-store.adapter'
import { SecretStore } from '@core/storage/ports'
import { HttpCatalogRepository } from '@features/catalog/data/repositories/http-catalog.repository'
import { CatalogRepository } from '@features/catalog/domain/ports/catalog-repository'
import { BrowseProducts } from '@features/catalog/domain/usecases/browse-products'
import { ListCategories } from '@features/catalog/domain/usecases/list-categories'
import { LoadHome } from '@features/catalog/domain/usecases/load-home'
import { ExpoGoogleAuthGateway } from '@features/auth/data/repositories/expo-google-auth.gateway'
import { HttpAuthRepository } from '@features/auth/data/repositories/http-auth.repository'
import { SecureSessionStorage } from '@features/auth/data/repositories/secure-session.storage'
import { AuthRepository } from '@features/auth/domain/ports/auth-repository'
import { SessionStorage } from '@features/auth/domain/ports/session-storage'
import { ActivateAccount } from '@features/auth/domain/usecases/activate-account'
import { ConfirmPasswordReset } from '@features/auth/domain/usecases/confirm-password-reset'
import { Register } from '@features/auth/domain/usecases/register'
import { RequestPasswordReset } from '@features/auth/domain/usecases/request-password-reset'
import { ResendActivation } from '@features/auth/domain/usecases/resend-activation'
import { RestoreSession } from '@features/auth/domain/usecases/restore-session'
import { SignIn } from '@features/auth/domain/usecases/sign-in'
import { SignInWithGoogle } from '@features/auth/domain/usecases/sign-in-with-google'
import { SignOut } from '@features/auth/domain/usecases/sign-out'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

export interface Container {
  readonly http: HttpClient
  readonly authRepository: AuthRepository
  readonly sessionStorage: SessionStorage
  readonly signIn: SignIn
  readonly signInWithGoogle: SignInWithGoogle
  readonly signOut: SignOut
  readonly restoreSession: RestoreSession
  readonly register: Register
  readonly activateAccount: ActivateAccount
  readonly resendActivation: ResendActivation
  readonly requestPasswordReset: RequestPasswordReset
  readonly confirmPasswordReset: ConfirmPasswordReset
  readonly browseProducts: BrowseProducts
  readonly loadHome: LoadHome
  readonly listCategories: ListCategories
}

/**
 * Conecta el estado de sesión con el cliente HTTP.
 *
 * Los captadores leen del almacén de Zustand de forma síncrona, que es lo que el interceptor
 * necesita. Cuando el backend entrega tokens nuevos hay que guardarlos también en el almacén
 * cifrado, y eso es asíncrono: se lanza sin esperar porque el interceptor no puede bloquearse. Si
 * esa escritura fallara, la sesión seguiría viva en memoria y solo se perdería al cerrar la app.
 */
function buildSessionBridge(sessionStorage: SessionStorage): SessionBridge {
  return {
    getAccessToken: () => useSessionStore.getState().accessToken,
    getRefreshToken: () => useSessionStore.getState().refreshToken,
    getCountry: () => useSessionStore.getState().user?.country ?? null,
    getLocale: () => useSessionStore.getState().locale,
    getCurrency: () => useSessionStore.getState().currency,
    onRefreshed: (accessToken, refreshToken) => {
      useSessionStore.getState().setTokens(accessToken, refreshToken)
      sessionStorage
        .save({ accessToken, refreshToken })
        .catch((error: unknown) => logger.warn('No se pudieron persistir los tokens renovados', error))
    },
    onExpired: () => {
      useSessionStore.getState().anonymous()
      sessionStorage
        .clear()
        .catch((error: unknown) => logger.warn('No se pudo limpiar la sesión caducada', error))
    },
  }
}

interface Overrides {
  secrets?: SecretStore
  captcha?: CaptchaSolver
}

/**
 * Construye el grafo de dependencias a mano. No se usa ninguna librería de inyección: en una
 * aplicación de este tamaño solo añadiría indirección y arranque más lento.
 *
 * `overrides` existe para las pruebas, que sustituyen el almacén cifrado o el CAPTCHA sin tocar
 * nada más del cableado.
 */
export function buildContainer(config: AppConfig, overrides: Overrides = {}): Container {
  const secrets: SecretStore = overrides.secrets ?? new ExpoSecretStore()
  const sessionStorage: SessionStorage = new SecureSessionStorage(secrets)
  const http = new HttpClient(config.apiBaseUrl, buildSessionBridge(sessionStorage))
  // El solucionador pide su reto por el mismo cliente, así que hereda cabeceras y tiempo de espera.
  const captcha: CaptchaSolver =
    overrides.captcha ?? new AltchaCaptchaSolver(() => http.get<Challenge>('/captcha/challenge'))
  const authRepository: AuthRepository = new HttpAuthRepository(http, captcha)
  const google = new ExpoGoogleAuthGateway(config.apiBaseUrl, authRepository)
  const catalogRepository: CatalogRepository = new HttpCatalogRepository(http)

  return {
    http,
    authRepository,
    sessionStorage,
    signIn: new SignIn(authRepository, sessionStorage),
    signInWithGoogle: new SignInWithGoogle(google, sessionStorage),
    signOut: new SignOut(authRepository, sessionStorage),
    restoreSession: new RestoreSession(authRepository, sessionStorage),
    register: new Register(authRepository),
    activateAccount: new ActivateAccount(authRepository),
    resendActivation: new ResendActivation(authRepository),
    requestPasswordReset: new RequestPasswordReset(authRepository),
    confirmPasswordReset: new ConfirmPasswordReset(authRepository),
    browseProducts: new BrowseProducts(catalogRepository),
    loadHome: new LoadHome(catalogRepository),
    listCategories: new ListCategories(catalogRepository),
  }
}
