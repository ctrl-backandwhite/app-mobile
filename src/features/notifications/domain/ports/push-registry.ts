import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

/** Lo que el dispositivo necesita para recibir avisos: su token y en qué sistema está. */
export interface PushDevice {
  readonly token: string
  readonly platform: string
}

/**
 * El sistema operativo del teléfono.
 *
 * <p>Pedir el permiso y obtener el token son cosas del dispositivo, no del servidor, y por eso van en
 * un puerto aparte del que habla con el backend: en las pruebas se sustituye uno sin tocar el otro.
 */
export interface PushDeviceGateway {
  /**
   * Pide permiso si hace falta y devuelve el token del dispositivo.
   *
   * <p>`null` cuando no se puede: permiso denegado, emulador sin servicios de Google, o compilación
   * sin credenciales de avisos. No es un error que haya que enseñar: es que este teléfono no va a
   * recibir avisos, y la aplicación funciona igual sin ellos.
   */
  obtainToken(): Promise<PushDevice | null>
}

/** El registro de dispositivos que guarda el backend. */
export interface PushRegistry {
  register(device: PushDevice): Promise<Result<void, AppError>>
  unregister(token: string): Promise<Result<void, AppError>>
}
