import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, Screen } from '@ds/components'
import { greetingNameOf, isStaff, UserRole } from '@features/auth/domain/entities/user'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administración',
  OPERATOR: 'Operaciones',
  PARTNER: 'Socio',
  USER: 'Revendedor',
}

const STAFF_NOTICE =
  'El back-office no se sirve desde la aplicación: para administrar la plataforma entra desde el escritorio.'

/**
 * La pestaña de cuenta.
 *
 * <p>Sustituye a la pantalla de bienvenida de la primera entrega, que era un saludo con dos botones y
 * llevaba meses haciendo de «Cuenta» sin serlo. En una tienda, esta pestaña es el sitio al que se
 * vuelve: los pedidos, lo guardado y los ajustes que cambian lo que se ve y lo que se paga.
 *
 * <p>Es una LISTA DE ACCESOS, no un formulario. Cada cosa vive en su pantalla y aquí solo se llega a
 * ella: apilar perfil, monedero y ajustes en una sola vista obliga a desplazarse para todo y no deja
 * sitio a lo que venga después.
 */
export function AccountScreen(): ReactElement {
  const { signOut, disablePushNotifications } = useContainer()
  const user = useSessionStore((state) => state.user)
  const currency = useSessionStore((state) => state.currency)
  const locale = useSessionStore((state) => state.locale)
  const [saliendo, setSaliendo] = useState(false)

  async function cierraSesion(): Promise<void> {
    setSaliendo(true)
    try {
      // Se retira ANTES de cerrar la sesión, que es cuando el token todavía vale. Sin esto, el
      // siguiente aviso de esta cuenta llegaría a un teléfono que ya no es suyo —o a manos ajenas si
      // se prestó—, y un aviso lleva título y cuerpo: sería una fuga de verdad.
      //
      // Si falla, se cierra la sesión igual: dejar a alguien dentro porque no se pudo dar de baja un
      // dispositivo sería peor que el problema que evita.
      await disablePushNotifications.execute()
      await signOut.execute()
      // El caso de uso ya ha borrado el almacén cifrado; el estado en memoria se vacía aquí para que
      // la guarda de rutas deje de dar por buena la sesión.
      useSessionStore.getState().anonymous()
      router.replace('/login')
    } finally {
      setSaliendo(false)
    }
  }

  // Entre el cierre de sesión y la redirección hay un render sin usuario. Devolver un contenedor
  // vacío evita que ese instante reviente la pantalla. Los hooks quedan por encima a propósito: una
  // salida temprana antes de ellos cambiaría su orden entre renders.
  if (!user) return <View testID="cuenta-vacia" />

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <View>
          <Text className="text-[13px] text-base-content opacity-70">Tu cuenta</Text>
          <Text className="mt-1 font-medium text-[24px] text-base-content">
            {greetingNameOf(user)}
          </Text>
          <Text className="mt-0.5 text-[13px] text-base-content opacity-60">{user.email}</Text>
        </View>

        {isStaff(user) ? <Alert variant="warning" message={STAFF_NOTICE} /> : null}

        <Card>
          <Acceso
            testID="ir-a-avisos"
            icono="🔔"
            titulo="Avisos"
            detalle="Pedidos, facturación y mensajes"
            onPress={() => router.push('/notifications')}
          />
          <Acceso
            testID="ir-a-pedidos"
            icono="🧾"
            titulo="Mis pedidos"
            detalle="Seguimiento, facturas y devoluciones"
            onPress={() => router.push('/orders')}
          />
          <Acceso
            testID="ir-a-guardados"
            icono="❤️"
            titulo="Guardados"
            detalle="Los productos que has marcado"
            onPress={() => router.push('/favorites')}
          />
          <Acceso
            testID="ir-a-monedero"
            icono="💳"
            titulo="Monedero"
            detalle="Saldo y movimientos"
            onPress={() => router.push('/wallet')}
          />
          <Acceso
            testID="ir-a-plan"
            icono="⭐"
            titulo="Mi plan"
            detalle="Suscripción y facturación"
            onPress={() => router.push('/settings/subscription')}
          />
          <Acceso
            testID="ir-a-region"
            icono="🌍"
            titulo="Idioma y divisa"
            // Se enseña lo que hay puesto AHORA: es el ajuste que decide los importes que se leen
            // antes de comprar, y tenerlo que abrir para saberlo sería esconderlo.
            detalle={`${locale.toUpperCase()} · ${currency}`}
            onPress={() => router.push('/settings/region')}
          />
          <Acceso
            testID="ir-a-seguridad"
            icono="🔒"
            titulo="Seguridad"
            detalle="Contraseña, sesiones y borrado de cuenta"
            onPress={() => router.push('/settings/security')}
            ultimo
          />
        </Card>

        <Card>
          <View className="gap-3">
            <Dato etiqueta="Perfil" valor={ROLE_LABELS[user.role]} />
            <Dato etiqueta="País de registro" valor={user.country ?? 'Sin definir'} />
          </View>
        </Card>

        <Button title="Cerrar sesión" onPress={cierraSesion} loading={saliendo} variant="outline" />
      </ScrollView>
    </Screen>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }): ReactElement {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[13px] text-base-content opacity-70">{etiqueta}</Text>
      <Text className="font-medium text-[14px] text-base-content">{valor}</Text>
    </View>
  )
}

interface AccesoProps {
  icono: string
  titulo: string
  detalle: string
  testID: string
  onPress: () => void
  ultimo?: boolean
}

/** Una fila de acceso. Alto de dedo y toda la fila pulsable, no solo el texto. */
function Acceso({ icono, titulo, detalle, testID, onPress, ultimo }: AccesoProps): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      className={`min-h-14 flex-row items-center gap-3 py-3 ${ultimo ? '' : 'border-b border-base-300'}`}
    >
      <Text className="text-[20px]">{icono}</Text>
      <View className="flex-1">
        <Text className="font-medium text-[14px] text-base-content">{titulo}</Text>
        <Text className="text-[12px] text-base-content opacity-60">{detalle}</Text>
      </View>
      <Text className="text-[16px] text-base-content opacity-40">›</Text>
    </Pressable>
  )
}
