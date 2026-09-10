import { ReactElement, ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { Edge, SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  children: ReactNode
  /** Sin margen lateral cuando la pantalla arranca con una cabecera a sangre. */
  padded?: boolean
  /** Centra el contenido cuando cabe entero: los formularios cortos quedan a media altura. */
  centered?: boolean
  /**
   * Qué bordes respeta el área segura.
   *
   * Por omisión SOLO el inferior. La mayoría de pantallas se abren desde otra y llevan la cabecera
   * del navegador encima, que ya deja libre la barra de estado: respetar también el borde superior
   * sumaba ese hueco dos veces y dejaba una franja muerta bajo el título. Las pestañas, que no
   * llevan cabecera, piden `['top', 'bottom']`.
   */
  edges?: readonly Edge[]
  /** Sin desplazamiento: para pantallas con lista propia, que ya se desplaza sola. */
  scroll?: boolean
}

export function Screen({
  children,
  padded = true,
  centered = false,
  edges = ['bottom'],
  scroll = true,
}: Props): ReactElement {
  return (
    // El mismo gris que el escaparate pinta en el `body`: la aplicación y la web se abren iguales.
    <SafeAreaView className="flex-1 bg-base-200" edges={edges}>
      <KeyboardAvoidingView
        className="flex-1"
        // Solo iOS superpone el teclado; Android ya redimensiona la ventana con `adjustResize`,
        // y aplicarle el desplazamiento encima deja un hueco bajo los campos.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerClassName={`grow ${padded ? 'px-5 py-6' : ''} ${centered ? 'justify-center' : ''}`}
            // Pulsar un botón con el teclado abierto debe activarlo, no limitarse a cerrarlo.
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
