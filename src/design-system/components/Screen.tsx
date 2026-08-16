import { ReactElement, ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  children: ReactNode
  /** Sin margen lateral cuando la pantalla arranca con una cabecera a sangre. */
  padded?: boolean
  /** Centra el contenido cuando cabe entero: los formularios cortos quedan a media altura. */
  centered?: boolean
}

export function Screen({ children, padded = true, centered = false }: Props): ReactElement {
  return (
    <SafeAreaView className="flex-1 bg-base-200" edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        className="flex-1"
        // Solo iOS superpone el teclado; Android ya redimensiona la ventana con `adjustResize`,
        // y aplicarle el desplazamiento encima deja un hueco bajo los campos.
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
