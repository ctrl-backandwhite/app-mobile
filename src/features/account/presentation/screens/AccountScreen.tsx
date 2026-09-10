import { router } from 'expo-router'
import { Bell, CreditCard, Globe, Heart, History, LogOut, MapPin, Receipt, ShieldCheck } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { ScrollView, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, ListRow, Screen, Text } from '@ds/components'
import { greetingNameOf, isStaff, UserRole } from '@features/auth/domain/entities/user'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { useCountryNames } from '@features/checkout/presentation/hooks/use-country-name'

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
  const nombreDelPais = useCountryNames()

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
    <Screen padded={false} edges={['top']}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <View>
          <Text variant="eyebrow" tone="muted">
            Tu cuenta
          </Text>
          <Text variant="heading" className="mt-1">
            {greetingNameOf(user)}
          </Text>
          <Text variant="label" tone="muted" className="mt-0.5">
            {user.email}
          </Text>
        </View>

        {isStaff(user) ? <Alert variant="warning" message={STAFF_NOTICE} /> : null}

        <Card padding="none" className="px-5 py-1">
          <ListRow
            testID="ir-a-avisos"
            icon={Bell}
            title="Avisos"
            description="Pedidos, facturación y mensajes"
            onPress={() => router.push('/notifications')}
          />
          <ListRow
            testID="ir-a-pedidos"
            icon={Receipt}
            title="Mis pedidos"
            description="Seguimiento, facturas y devoluciones"
            onPress={() => router.push('/orders')}
          />
          <ListRow
            testID="ir-a-guardados"
            icon={Heart}
            title="Guardados"
            description="Los productos que has marcado"
            onPress={() => router.push('/favorites')}
          />
          {/* Junto a «Guardados» porque son la misma intención en dos grados: lo que interesó tanto
              como para marcarlo y lo que solo se llegó a mirar. */}
          <ListRow
            testID="ir-a-historial"
            icon={History}
            title="Lo que has visto"
            description="Vuelve a las fichas que abriste"
            onPress={() => router.push('/settings/viewed')}
          />
          <ListRow
            testID="ir-a-direcciones"
            icon={MapPin}
            title="Direcciones"
            description="A dónde llegan tus pedidos"
            onPress={() => router.push('/settings/addresses')}
          />
          <ListRow
            testID="ir-a-monedero"
            icon={CreditCard}
            title="Monedero"
            description="Saldo y movimientos"
            onPress={() => router.push('/wallet')}
          />
          <ListRow
            testID="ir-a-region"
            icon={Globe}
            title="Idioma y divisa"
            // Se enseña lo que hay puesto AHORA: es el ajuste que decide los importes que se leen
            // antes de comprar, y tenerlo que abrir para saberlo sería esconderlo.
            description={`${locale.toUpperCase()} · ${currency}`}
            onPress={() => router.push('/settings/region')}
          />
          <ListRow
            testID="ir-a-seguridad"
            icon={ShieldCheck}
            title="Seguridad"
            description="Contraseña, sesiones y borrado de cuenta"
            onPress={() => router.push('/settings/security')}
            last
          />
        </Card>

        <Card>
          <View className="gap-3">
            <Dato etiqueta="Perfil" valor={ROLE_LABELS[user.role]} />
            <Dato etiqueta="País de registro" valor={nombreDelPais(user.country) || 'Sin definir'} />
          </View>
        </Card>

        <Button
          title="Cerrar sesión"
          onPress={cierraSesion}
          loading={saliendo}
          variant="outline"
          icon={LogOut}
        />
      </ScrollView>
    </Screen>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }): ReactElement {
  return (
    <View className="flex-row items-center justify-between">
      <Text variant="label" tone="muted">
        {etiqueta}
      </Text>
      <Text variant="label">{valor}</Text>
    </View>
  )
}
