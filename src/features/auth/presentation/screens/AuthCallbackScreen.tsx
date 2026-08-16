import { router } from 'expo-router'
import { ReactElement, useEffect, useMemo, useState, useSyncExternalStore } from 'react'
import { ActivityIndicator, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { capturedAuthLink, onAuthLink } from '@core/linking/incoming-link'
import { logger } from '@core/logger/logger'
import { Alert, Button, Screen } from '@ds/components'
import { readSocialCallback } from '@features/auth/domain/policies/social-callback'

import { useSessionStore } from '../state/session.store'

/**
 * Pantalla de vuelta del acceso social.
 *
 * Existe porque el sistema operativo puede abrir la aplicación con el enlace `nx036://auth/callback`
 * en lugar de devolver el control a la vista de navegador que lo inició. Cuando eso ocurre, sin una
 * ruta que lo atienda los tokens llegan y se pierden: se ve «Unmatched Route» después de haberse
 * identificado correctamente.
 */
export function AuthCallbackScreen(): ReactElement {
  const { completeSocialLogin } = useContainer()
  const signedIn = useSessionStore((state) => state.signedIn)

  /*
   * El enlace se lee de donde quedó guardado al llegar, no se escucha desde aquí.
   *
   * Cuando el sistema lo entrega a la aplicación viva, el evento se emite una sola vez y lo recoge
   * expo-router para navegar hasta esta pantalla; para cuando ella se monta, ya ha pasado. Escuchar
   * aquí era llegar tarde siempre.
   */
  const url = useSyncExternalStore(onAuthLink, capturedAuthLink)

  // Lo que dice el enlace se deriva, no se guarda en estado: es una función de la URL y calcularlo
  // dentro de un efecto provocaría un pintado de más en cada vuelta.
  const callback = useMemo(() => readSocialCallback(url), [url])
  const [failure, setFailure] = useState<string | null>(null)
  const [timedOut, setTimedOut] = useState(false)

  // Una espera infinita es un fallo en sí: si el enlace no trae sesión, hay que decirlo y ofrecer
  // salida en lugar de dejar el indicador girando.
  useEffect(() => {
    if (callback.accessToken) return
    const timer = setTimeout(() => setTimedOut(true), 6000)
    return () => clearTimeout(timer)
  }, [callback])

  useEffect(() => {
    // Se tapan los dos: un token de renovación en el registro del sistema vale tanto como el de
    // acceso, y dura mucho más.
    if (url) logger.info(`Vuelta del acceso social: ${url.replace(/(token|refresh)=[^&]+/g, '$1=***')}`)
  }, [url])

  useEffect(() => {
    const { accessToken, refreshToken } = callback
    if (!accessToken || !refreshToken) return

    let cancelled = false
    completeSocialLogin
      .execute(accessToken, refreshToken)
      .then((result) => {
        if (cancelled) return
        if (!result.ok) {
          setFailure(result.error.message)
          return
        }
        signedIn(result.value.user, result.value.accessToken, result.value.refreshToken)
        router.replace('/')
      })
      .catch(() => {
        if (!cancelled) setFailure('No se ha podido completar el acceso.')
      })

    return () => {
      cancelled = true
    }
  }, [callback, completeSocialLogin, signedIn])

  const error =
    callback.rejection ??
    failure ??
    (timedOut ? 'El acceso no ha devuelto una sesión. Vuelve a intentarlo.' : null)

  if (error) {
    return (
      <Screen>
        <View className="gap-4 py-10">
          <Alert variant="error" message={error} />
          <Button title="Volver al acceso" onPress={() => router.replace('/login')} />
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <View className="items-center gap-3 py-16">
        <ActivityIndicator />
        <Text className="text-[13px] text-base-content opacity-70">Completando el acceso…</Text>
      </View>
    </Screen>
  )
}
