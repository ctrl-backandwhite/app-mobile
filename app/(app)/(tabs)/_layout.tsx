import { Ionicons } from '@expo/vector-icons'
import { Tabs } from 'expo-router'
import { ReactElement } from 'react'
import { useColorScheme } from 'react-native'

import { colors } from '@ds/tokens'

/**
 * Barra inferior de la aplicación. Es el patrón que espera quien usa un móvil para moverse entre las
 * zonas principales, frente a un menú lateral que esconde la navegación tras un gesto.
 *
 * Los colores se leen de los tokens y no de clases: las opciones del navegador se configuran con
 * objetos de estilo, fuera del alcance de NativeWind.
 */
export default function TabsLayout(): ReactElement {
  const dark = useColorScheme() === 'dark'
  const palette = dark ? colors.dark : colors.light

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.baseContent,
        tabBarStyle: {
          backgroundColor: palette.base100,
          borderTopColor: palette.base300,
        },
        tabBarLabelStyle: { fontFamily: 'Roboto_400Regular', fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Catálogo',
          tabBarIcon: ({ color, size }) => <Ionicons name="grid-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Cuenta',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  )
}
