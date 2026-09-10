import { Tabs } from 'expo-router'
import { Heart, House, LayoutGrid, ShoppingBag, User } from 'lucide-react-native'
import { ReactElement } from 'react'

import { fontFamily, useTheme } from '@ds/tokens'
import { useCartCountStore } from '@features/cart/presentation/state/cart-count.store'

/**
 * Barra inferior de la aplicación. Es el patrón que espera quien usa un móvil para moverse entre las
 * zonas principales, frente a un menú lateral que esconde la navegación tras un gesto.
 *
 * Los colores se leen de los tokens y no de clases: las opciones del navegador se configuran con
 * objetos de estilo, fuera del alcance de NativeWind.
 */
export default function TabsLayout(): ReactElement {
  const palette = useTheme()
  const unidades = useCartCountStore((state) => state.units)

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        // Antes el inactivo era la tinta plena, así que las cinco pestañas pesaban igual y no se
        // distinguía dónde estabas. La tinta media deja que la activa destaque sola.
        tabBarInactiveTintColor: palette.muted,
        /*
          Sin alto fijo: React Navigation le suma el margen inferior del sistema, que es lo que deja
          los rótulos por encima de la barra de gestos. Con un alto escrito a mano —60 px— «Guardados»
          quedaba cortado por la raya de navegación de Android.
        */
        tabBarStyle: {
          backgroundColor: palette.base100,
          borderTopColor: palette.base300,
          paddingTop: 6,
        },
        tabBarLabelStyle: { fontFamily: fontFamily.regular, fontSize: 11, letterSpacing: 0.1 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <House color={color} size={22} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color }) => <LayoutGrid color={color} size={22} strokeWidth={1.5} />,
        }}
      />
      {/*
        Guardados entre el catálogo y la cesta, que es donde se espera en una tienda: el recorrido va de
        mirar a querer a comprar. Cinco pestañas es el máximo que admite una barra inferior sin que los
        rótulos se corten.
      */}
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Guardados',
          tabBarIcon: ({ color }) => <Heart color={color} size={22} strokeWidth={1.5} />,
        }}
      />
      <Tabs.Screen
        name="cart"
        options={{
          title: 'Cesta',
          tabBarIcon: ({ color }) => <ShoppingBag color={color} size={22} strokeWidth={1.5} />,
          /*
            Cuántas unidades esperan en la cesta. Sin este número, añadir un producto no dejaba
            ninguna señal fuera de la propia ficha y había que entrar en la cesta para comprobar que
            el toque había servido de algo.
          */
          tabBarBadge: unidades > 0 ? unidades : undefined,
          tabBarBadgeStyle: {
            backgroundColor: palette.accent,
            color: palette.accentContent,
            fontFamily: fontFamily.medium,
            fontSize: 10,
          },
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color }) => <User color={color} size={22} strokeWidth={1.5} />,
        }}
      />
    </Tabs>
  )
}
