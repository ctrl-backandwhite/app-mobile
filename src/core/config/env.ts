export interface AppConfig {
  readonly apiBaseUrl: string
  readonly webBaseUrl: string
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
    /*
     * La web NO es el backend. Los documentos legales viven en el escaparate, y darlos por servidos
     * desde `apiBaseUrl` los mandaba al host de la API, donde no existen: enlaces a un 404 justo en la
     * pantalla donde el usuario declara haberlos leído.
     *
     * El valor por defecto es el sitio de producción a propósito. Los textos legales son públicos y los
     * mismos en los tres entornos, así que si la variable falta es mejor abrir el documento bueno que
     * no abrir ninguno.
     */
    webBaseUrl: (source.EXPO_PUBLIC_WEB_BASE_URL ?? 'https://nx036.com').replace(/\/+$/, ''),
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
  if (!cached) {
    /*
     * Cada variable se nombra ENTERA y de forma literal. No es verbosidad: Babel sustituye
     * `process.env.EXPO_PUBLIC_*` por su valor en tiempo de compilación **solo** cuando ve el acceso
     * escrito así. Pasar `process.env` como objeto y leer las claves después no le deja nada que
     * sustituir, y el paquete sale sin la URL del backend.
     *
     * Lo peor es que en desarrollo no se nota —Metro inyecta el entorno completo—, así que el fallo
     * solo aparece en una compilación real: la aplicación se cierra al arrancar porque no encuentra
     * la configuración. Ocurrió con el primer APK.
     */
    cached = readConfig({
      EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL,
      EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL,
      EXPO_PUBLIC_DEFAULT_CURRENCY: process.env.EXPO_PUBLIC_DEFAULT_CURRENCY,
      EXPO_PUBLIC_DEFAULT_LOCALE: process.env.EXPO_PUBLIC_DEFAULT_LOCALE,
    })
  }
  return cached
}
