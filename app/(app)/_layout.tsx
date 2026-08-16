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
    </Stack>
  )
}
