import { Redirect, Stack } from 'expo-router'
import { ReactElement } from 'react'

import { useSessionStore } from '@features/auth/presentation/state/session.store'

/** Guarda de la zona con sesión: sin ella, al acceso. */
export default function AppLayout(): ReactElement {
  const status = useSessionStore((state) => state.status)

  if (status === 'anonymous') return <Redirect href="/login" />

  return <Stack screenOptions={{ headerShown: false }} />
}
