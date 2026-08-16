import { Redirect, Stack } from 'expo-router'
import { ReactElement } from 'react'

import { useSessionStore } from '@features/auth/presentation/state/session.store'

/**
 * Guarda del grupo de acceso: quien ya tiene sesión no tiene nada que hacer aquí.
 *
 * El estado `loading` no decide nada; para cuando estas rutas se montan, el layout raíz ya ha
 * terminado de restaurar la sesión.
 */
export default function AuthLayout(): ReactElement {
  const status = useSessionStore((state) => state.status)

  if (status === 'authenticated') return <Redirect href="/" />

  return <Stack screenOptions={{ headerShown: false }} />
}
