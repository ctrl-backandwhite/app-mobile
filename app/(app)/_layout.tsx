import { Redirect, Stack } from 'expo-router'
import { ReactElement } from 'react'

import { useSessionStore } from '@features/auth/presentation/state/session.store'

/** Guarda de la zona con sesión: sin ella, al acceso. */
export default function AppLayout(): ReactElement {
  const status = useSessionStore((state) => state.status)

  if (status === 'anonymous') return <Redirect href="/login" />

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      {/* La ficha se abre sobre las pestañas y se cierra con el gesto de volver del sistema. */}
      <Stack.Screen name="product/[slug]" options={{ presentation: 'card' }} />
      {/*
        Las pantallas de cuenta SÍ llevan cabecera. Sin ella solo se sale con el gesto del sistema
        —que en iOS es lo único que hay— y una pantalla de ajustes de la que no se ve cómo volver es
        una pantalla en la que la gente se queda encallada. La cabecera nativa además pone el título,
        que aquí es lo que dice dónde se ha entrado.
      */}
      <Stack.Screen name="wallet" options={{ headerShown: true, title: 'Monedero' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Avisos' }} />
      <Stack.Screen
        name="settings/region"
        options={{ headerShown: true, title: 'Idioma y divisa' }}
      />
      <Stack.Screen name="settings/security" options={{ headerShown: true, title: 'Seguridad' }} />
      <Stack.Screen
        name="settings/subscription"
        options={{ headerShown: true, title: 'Mi plan' }}
      />
      <Stack.Screen
        name="settings/delete-account"
        options={{ headerShown: true, title: 'Eliminar mi cuenta' }}
      />
    </Stack>
  )
}
