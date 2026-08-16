import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, Screen } from '@ds/components'
import { greetingNameOf, isStaff, UserRole } from '@features/auth/domain/entities/user'

import { useSessionStore } from '../state/session.store'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administración',
  OPERATOR: 'Operaciones',
  PARTNER: 'Socio',
  USER: 'Revendedor',
}

const STAFF_NOTICE =
  'El back-office no se sirve desde la aplicación: para administrar la plataforma entra desde el escritorio.'

function InfoRow({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[13px] text-base-content opacity-70">{label}</Text>
      <Text className="font-medium text-[14px] text-base-content">{value}</Text>
    </View>
  )
}

export function HomeScreen(): ReactElement {
  const { signOut } = useContainer()
  const user = useSessionStore((state) => state.user)
  const currency = useSessionStore((state) => state.currency)
  const [leaving, setLeaving] = useState(false)

  async function leave(): Promise<void> {
    setLeaving(true)
    try {
      await signOut.execute()
      // El caso de uso ya ha borrado el almacén cifrado; el estado en memoria se vacía aquí para
      // que la guarda de rutas deje de dar por buena la sesión.
      useSessionStore.getState().anonymous()
      router.replace('/login')
    } finally {
      setLeaving(false)
    }
  }

  // Entre el cierre de sesión y la redirección hay un render sin usuario. Devolver un contenedor
  // vacío evita que ese instante reviente la pantalla. Los hooks quedan por encima a propósito: una
  // salida temprana antes de ellos cambiaría su orden entre renders.
  if (!user) return <View testID="home-empty" />

  return (
    <Screen>
      <Text className="text-[13px] text-base-content opacity-70">Bienvenido de nuevo</Text>
      <Text className="mt-1 font-medium text-[26px] text-base-content">
        {`Hola, ${greetingNameOf(user)}`}
      </Text>

      {isStaff(user) ? (
        <View className="mt-5">
          <Alert variant="warning" message={STAFF_NOTICE} />
        </View>
      ) : null}

      <Card className="mt-5">
        <View className="gap-3">
          <InfoRow label="Perfil" value={ROLE_LABELS[user.role]} />
          <InfoRow label="País" value={user.country ?? 'Sin definir'} />
          <InfoRow label="Divisa" value={currency} />
        </View>
      </Card>

      <View className="mt-6 gap-3">
        <Button
          title="Mis pedidos"
          onPress={() => router.push('/orders')}
          variant="outline"
        />
        <Button title="Cerrar sesión" onPress={leave} loading={leaving} variant="outline" />
      </View>
    </Screen>
  )
}
