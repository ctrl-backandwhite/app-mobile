import * as Crypto from 'expo-crypto'

import { logger } from '@core/logger/logger'
import { PreferenceStore } from '@core/storage/ports'

const KEY = 'nx036.device.id'
/** Misma forma que el identificador que emite el backend: UUID sin guiones. */
const SHAPE = /^[0-9a-f]{32}$/

/**
 * Quién es ESTE teléfono, de una instalación a la siguiente.
 *
 * <p>El backend reconocía el dispositivo por una cookie, y un cliente nativo no lleva cookies: cada
 * entrada creaba una sesión NUEVA, ninguna salía marcada como «esta» y la pantalla de seguridad
 * acababa con cientos de filas idénticas entre las que no se podía distinguir el propio teléfono.
 * Con un identificador propio, la misma instalación reutiliza siempre su fila.
 *
 * <p>Vive en el almacén de preferencias y NO en el cifrado: no es una credencial —no autoriza nada,
 * eso lo hace el token— y tiene que sobrevivir al cierre de sesión, que es justo cuando el almacén
 * de credenciales se vacía.
 *
 * <p>Se lee UNA vez al arrancar y se guarda en memoria porque el interceptor de peticiones es
 * síncrono y no puede esperar al disco. Sin cargar, no se manda cabecera: es preferible a bloquear
 * la petición.
 */
let cached: string | null = null

export async function loadDeviceId(store: PreferenceStore): Promise<void> {
  try {
    const saved = await store.get(KEY)
    if (saved && SHAPE.test(saved)) {
      cached = saved
      return
    }
    const fresh = Crypto.randomUUID().replace(/-/g, '')
    await store.set(KEY, fresh)
    cached = fresh
  } catch (error) {
    // Sin identificador se sigue funcionando: el backend cae a su comportamiento de siempre y
    // registra una sesión nueva. Peor que reutilizarla, mejor que no dejar entrar.
    logger.warn('No se pudo preparar el identificador del dispositivo', error)
  }
}

export function getDeviceId(): string | null {
  return cached
}

/** Solo para las pruebas: devuelve el módulo a su estado inicial. */
export function resetDeviceIdForTests(): void {
  cached = null
}
