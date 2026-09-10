import { Redirect, Stack } from 'expo-router'
import { ReactElement } from 'react'

import { fontFamily, useTheme } from '@ds/tokens'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

/** Guarda de la zona con sesión: sin ella, al acceso. */
export default function AppLayout(): ReactElement {
  const status = useSessionStore((state) => state.status)
  const palette = useTheme()

  if (status === 'anonymous') return <Redirect href="/login" />

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        /*
         * La cabecera del navegador con la ropa de la marca.
         *
         * Sin esto salía con la tipografía del sistema y sobre blanco, mientras el resto de la
         * pantalla iba en Roboto sobre el gris del escaparate: la barra se veía pegada, de otra
         * aplicación. Va del mismo gris que el cuerpo y sin sombra, así que cabecera y contenido son
         * una sola superficie.
         */
        headerStyle: { backgroundColor: palette.base200 },
        headerShadowVisible: false,
        headerTintColor: palette.baseContent,
        headerTitleStyle: {
          fontFamily: fontFamily.medium,
          fontSize: 17,
          color: palette.baseContent,
        },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: palette.base200 },
      }}
    >
      <Stack.Screen name="(tabs)" />
      {/*
        La ficha NO lleva cabecera: la galería sube hasta el borde de la pantalla y una barra encima
        se comería la primera foto, que es lo que vende. Lleva en su lugar un botón flotante para
        volver, sobre la galería y junto al de favoritos.
      */}
      <Stack.Screen name="product/[slug]" options={{ presentation: 'card' }} />
      {/*
        Las pantallas de cuenta SÍ llevan cabecera. Sin ella solo se sale con el gesto del sistema
        —que en iOS es lo único que hay— y una pantalla de ajustes de la que no se ve cómo volver es
        una pantalla en la que la gente se queda encallada. La cabecera nativa además pone el título,
        que aquí es lo que dice dónde se ha entrado.
      */}
      {/*
        El mismo motivo vale para los pedidos y el pago: sin cabecera solo se sale con el gesto del
        sistema, y de una pantalla de la que no se ve cómo volver la gente se sale de la aplicación
        entera. Se pintaban su propio título por dentro, que ahora sobra: lo pone la cabecera.
      */}
      <Stack.Screen name="orders/index" options={{ headerShown: true, title: 'Mis pedidos' }} />
      <Stack.Screen name="orders/[id]" options={{ headerShown: true, title: 'Pedido' }} />
      <Stack.Screen name="checkout/index" options={{ headerShown: true, title: 'Tramitar pedido' }} />
      <Stack.Screen name="checkout/address" options={{ headerShown: true, title: 'Nueva dirección' }} />
      <Stack.Screen name="checkout/add-card" options={{ headerShown: true, title: 'Nueva tarjeta' }} />
      <Stack.Screen name="wallet" options={{ headerShown: true, title: 'Monedero' }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: 'Avisos' }} />
      <Stack.Screen
        name="wallet-recharge"
        options={{ headerShown: true, title: 'Recargar monedero' }}
      />
      <Stack.Screen
        name="settings/region"
        options={{ headerShown: true, title: 'Idioma y divisa' }}
      />
      <Stack.Screen
        name="settings/addresses"
        options={{ headerShown: true, title: 'Direcciones' }}
      />
      <Stack.Screen
        name="settings/viewed"
        options={{ headerShown: true, title: 'Lo que has visto' }}
      />
      <Stack.Screen name="settings/security" options={{ headerShown: true, title: 'Seguridad' }} />
      <Stack.Screen
        name="settings/delete-account"
        options={{ headerShown: true, title: 'Eliminar mi cuenta' }}
      />
    </Stack>
  )
}
