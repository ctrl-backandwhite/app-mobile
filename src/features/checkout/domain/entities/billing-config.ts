/**
 * Ajustes del cobro con tarjeta, tal como los publica el backend.
 *
 * La clave pública NO se escribe en el repositorio: cambia entre local, preproducción y producción,
 * y llevarla incrustada obligaría a recompilar la aplicación para cambiar de entorno —además de
 * publicar en el código una credencial que pertenece a la instalación, no al programa.
 */
export interface BillingConfig {
  /** Clave pública de la pasarela. Falta cuando el entorno no tiene el cobro con tarjeta montado. */
  readonly publishableKey?: string
  /** El backend decide si el cobro con tarjeta está activo; la app no lo supone. */
  readonly enabled: boolean
}

/**
 * Si se puede pedir una tarjeta en este entorno.
 *
 * Hacen falta las dos cosas: que el backend lo dé por activo y que haya clave con la que hablar con
 * la pasarela. Enseñar el formulario sin clave acabaría en un fallo al pulsar guardar.
 */
export function acceptsCards(config?: BillingConfig): boolean {
  return Boolean(config?.enabled && config.publishableKey)
}
