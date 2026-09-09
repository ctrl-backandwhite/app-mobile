import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { useEffect } from 'react'

/**
 * Con la aplicación ABIERTA, el sistema no enseña nada por defecto: da por hecho que la propia
 * pantalla ya informa. Aquí no es cierto —quien está mirando el catálogo no ve el buzón—, así que se
 * pide que se muestre igual. El sonido sí, la insignia no: el número en el icono se queda pegado
 * hasta que alguien lo limpia, y la lista de avisos ya dice cuántos hay sin leer.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

/**
 * Lleva al buzón cuando se toca un aviso del sistema.
 *
 * <p>Sin esto, tocar el aviso abre la aplicación por donde se quedó: quien lo pulsa porque le
 * interesa lo que decía se encuentra la portada y tiene que buscar el mensaje a mano.
 *
 * <p>Cubre los dos casos, y son distintos: con la aplicación ABIERTA la respuesta llega por el
 * oyente, y con la aplicación CERRADA —el caso más común, porque el aviso llega justo cuando no se
 * está mirando— la respuesta ya ocurrió antes de arrancar y hay que ir a buscarla.
 */
export function useNotificationTaps(): void {
  useEffect(() => {
    let vivo = true

    function abreElBuzon(): void {
      if (vivo) router.push('/notifications')
    }

    void Notifications.getLastNotificationResponseAsync()
      .then((ultima) => {
        if (ultima) abreElBuzon()
      })
      .catch(() => undefined)

    const suscripcion = Notifications.addNotificationResponseReceivedListener(abreElBuzon)
    return () => {
      vivo = false
      suscripcion.remove()
    }
  }, [])
}
