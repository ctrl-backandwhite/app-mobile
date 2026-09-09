import '../global.css'

import {
  Roboto_300Light,
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  useFonts,
} from '@expo-google-fonts/roboto'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { ReactElement, useEffect, useState } from 'react'
import { SafeAreaProvider } from 'react-native-safe-area-context'

import { ContainerProvider } from '@composition/container.provider'
import { getAppConfig } from '@core/config/env'
import { startCapturingIncomingLinks } from '@core/linking/incoming-link'
import { useBootstrapSession } from '@features/auth/presentation/hooks/use-bootstrap-session'
import { useRefetchOnRegionChange } from '@features/auth/presentation/hooks/use-refetch-on-region-change'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { CardPaymentProvider } from '@features/checkout/presentation/components'
import { useMergeGuestCart } from '@features/cart/presentation/hooks/use-merge-guest-cart'
import { useLoadFavorites } from '@features/favorites/presentation/hooks/use-load-favorites'
import { useNotificationTaps } from '@features/notifications/presentation/hooks/use-notification-taps'

// Retener el arranque evita el salto tipográfico: sin esto la primera pintura sale con la fuente
// del sistema y se recompone al entrar Roboto.
void SplashScreen.preventAutoHideAsync()

// Antes de pintar nada, y a propósito: el enlace de vuelta del acceso llega una sola vez y hay que
// estar escuchando desde antes de que expo-router navegue con él.
startCapturingIncomingLinks()

/**
 * Restaura la sesión y mantiene el arranque en pantalla hasta saber si hay una.
 *
 * Va en un componente aparte porque necesita estar por dentro del proveedor de dependencias, y el
 * proveedor lo monta el layout raíz.
 */
function SessionGate({ fontsReady }: { fontsReady: boolean }): ReactElement | null {
  useBootstrapSession()
  useRefetchOnRegionChange()
  useLoadFavorites()
  useMergeGuestCart()
  useNotificationTaps()
  const status = useSessionStore((state) => state.status)
  const ready = fontsReady && status !== 'loading'

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync()
  }, [ready])

  // Sin esta espera, quien ya tiene sesión vería aparecer la pantalla de acceso durante un instante
  // antes de que la guarda le expulsara de ella.
  if (!ready) return null

  return <Stack screenOptions={{ headerShown: false }} />
}

export default function RootLayout(): ReactElement {
  const [loaded, error] = useFonts({
    Roboto_300Light,
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
  })
  // El cliente de consultas se crea una sola vez: recrearlo en cada render vaciaría su caché.
  const [queryClient] = useState(() => new QueryClient())

  // Un fallo al cargar la fuente no puede dejar la aplicación clavada: se sigue con la del sistema.
  const fontsReady = loaded || Boolean(error)

  return (
    <SafeAreaProvider>
      <ContainerProvider config={getAppConfig()}>
        <QueryClientProvider client={queryClient}>
          {/* Va por dentro del proveedor de consultas: la clave pública de Stripe se pide al
              backend, no se escribe en el código, así cambia sola entre entornos. Si aún no ha
              llegado, la aplicación se pinta igual y solo el formulario de tarjeta espera. */}
          <CardPaymentProvider>
            <SessionGate fontsReady={fontsReady} />
          </CardPaymentProvider>
          <StatusBar style="auto" />
        </QueryClientProvider>
      </ContainerProvider>
    </SafeAreaProvider>
  )
}
