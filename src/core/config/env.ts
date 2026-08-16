export interface AppConfig {
  readonly apiBaseUrl: string
  readonly defaultCurrency: string
  readonly defaultLocale: string
}

/**
 * Lee la configuración de un mapa de variables en vez de tocar `process.env` directamente, para que
 * los tests puedan pasarle un objeto literal y no dependan del entorno de ejecución.
 */
export function readConfig(source: Record<string, string | undefined>): AppConfig {
  const raw = source.EXPO_PUBLIC_API_BASE_URL
  if (!raw) throw new Error('Falta la variable EXPO_PUBLIC_API_BASE_URL')
  return {
    apiBaseUrl: raw.replace(/\/+$/, ''),
    defaultCurrency: source.EXPO_PUBLIC_DEFAULT_CURRENCY ?? 'USD',
    defaultLocale: source.EXPO_PUBLIC_DEFAULT_LOCALE ?? 'es',
  }
}

let cached: AppConfig | null = null

/**
 * Configuración de la aplicación, leída una sola vez y en el momento de usarla.
 *
 * Se resuelve de forma perezosa a propósito: si fuera una constante de módulo, importar este
 * fichero desde cualquier sitio —un test, una utilidad— fallaría cuando el entorno no define la
 * URL del backend, y el fallo aparecería en el import y no donde está la causa.
 */
export function getAppConfig(): AppConfig {
  if (!cached) cached = readConfig(process.env as Record<string, string | undefined>)
  return cached
}
