// axios expone `create` como exportación con nombre además de como método del objeto por defecto, y
// la regla lo confunde con un error. Aquí `axios.create` es la forma idiomática documentada.
/* eslint-disable import/no-named-as-default-member */
import axios, { AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'

import { mapHttpError } from '@core/errors/http-error-mapper'
import { logger } from '@core/logger/logger'

import { SessionBridge } from './session-bridge'

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

interface RefreshResponse {
  token: string
  refreshToken: string
}

/**
 * Rutas del propio acceso. Un 401 aquí es la respuesta legítima del backend —credenciales
 * incorrectas o segundo factor pendiente—, no un token caducado. Reintentarlas tras renovar
 * perdería el código MFA_REQUIRED, que es justo lo que la pantalla necesita para pedir el código.
 */
const AUTH_PATHS = ['/auth/login', '/auth/refresh']

const TIMEOUT_MS = 20000

export class HttpClient {
  /** Instancia con interceptores: la que usa toda la aplicación. */
  readonly raw: AxiosInstance
  /**
   * Instancia sin interceptores, reservada a la renovación del token. Es una instancia propia y no
   * el axios global para que la renovación se pueda observar y sustituir en las pruebas igual que
   * cualquier otra llamada.
   */
  readonly rawRefresh: AxiosInstance
  private refreshing: Promise<string | null> | null = null

  constructor(
    private readonly baseUrl: string,
    private readonly session: SessionBridge,
  ) {
    this.raw = axios.create({
      baseURL: `${baseUrl}/api`,
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT_MS,
    })
    this.rawRefresh = axios.create({
      baseURL: `${baseUrl}/api`,
      headers: { 'Content-Type': 'application/json' },
      timeout: TIMEOUT_MS,
    })
    this.installRequestInterceptor()
    this.installResponseInterceptor()
  }

  private installRequestInterceptor(): void {
    this.raw.interceptors.request.use((config) => {
      const url = config.url ?? ''
      // Una URL absoluta anula la baseURL de axios. Sin este guard, una llamada futura a un
      // servicio de terceros filtraría el token de la persona usuaria.
      const isAbsolute = /^https?:\/\//i.test(url)
      const belongsToBackend = !isAbsolute || url.startsWith(this.baseUrl)
      const token = this.session.getAccessToken()
      if (token && belongsToBackend) config.headers.set('Authorization', `Bearer ${token}`)

      config.headers.set('X-Currency', this.session.getCurrency())
      // El país solo viaja si el usuario lo tiene: sin él, el backend lo deduce por IP o cae a la
      // regla base, que es el comportamiento correcto para quien navega sin cuenta.
      const country = this.session.getCountry()
      if (country) config.headers.set('X-Country', country)
      const locale = this.session.getLocale()
      config.headers.set('Accept-Language', locale)
      config.headers.set('X-Lang', locale)
      return config
    })
  }

  private installResponseInterceptor(): void {
    this.raw.interceptors.response.use(
      (response) => response,
      async (error: unknown) => {
        const config = (error as { config?: RetriableConfig }).config
        const status = (error as { response?: { status: number } }).response?.status
        const url = config?.url ?? ''
        const isAuthCall = AUTH_PATHS.some((path) => url.includes(path))

        if (status === 401 && config && !config._retried && !isAuthCall) {
          const renewed = await this.refreshOnce()
          if (renewed) {
            config._retried = true
            config.headers.set('Authorization', `Bearer ${renewed}`)
            return this.raw(config)
          }
          this.session.onExpired()
        }
        return Promise.reject(mapHttpError(error))
      },
    )
  }

  /**
   * Renovación en vuelo único: cuando varias peticiones reciben un 401 a la vez, todas esperan a
   * la misma llamada. Sin esto, cada pantalla abierta lanzaría su propia renovación y el backend
   * invalidaría los tokens de las demás.
   */
  private refreshOnce(): Promise<string | null> {
    if (!this.refreshing) {
      this.refreshing = this.doRefresh().finally(() => {
        this.refreshing = null
      })
    }
    return this.refreshing
  }

  private async doRefresh(): Promise<string | null> {
    const refreshToken = this.session.getRefreshToken()
    if (!refreshToken) return null
    try {
      // Instancia sin interceptores: pasar por `this.raw` volvería a entrar en el de respuesta y
      // un fallo de la renovación dispararía otra renovación.
      const { data } = await this.rawRefresh.post<RefreshResponse>('/auth/refresh', { refreshToken })
      this.session.onRefreshed(data.token, data.refreshToken)
      return data.token
    } catch (error) {
      logger.warn('No se pudo renovar la sesión', error)
      return null
    }
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.raw.get<T>(url, config)).data
  }

  async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.raw.post<T>(url, body, config)).data
  }

  async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return (await this.raw.put<T>(url, body, config)).data
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return (await this.raw.delete<T>(url, config)).data
  }
}
