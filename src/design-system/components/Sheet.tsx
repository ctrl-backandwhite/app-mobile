import { X } from 'lucide-react-native'
import { ReactElement, ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Icon } from './Icon'
import { Text } from './Text'

interface Props {
  visible: boolean
  onClose: () => void
  title: string
  children: ReactNode
  /** Acción principal fija al pie: aplicar, guardar, confirmar. */
  footer?: ReactNode
}

/**
 * Hoja que sube desde abajo.
 *
 * Es el sitio donde va lo que modifica la pantalla que hay detrás —filtros, elegir una opción, un
 * formulario corto—: al no tapar del todo, se sigue viendo sobre qué se está decidiendo, cosa que
 * una pantalla nueva pierde.
 */
export function Sheet({ visible, onClose, title, children, footer }: Props): ReactElement {
  const insets = useSafeAreaInsets()

  return (
    <Modal
      visible={visible}
      // Translúcido para que se siga viendo la pantalla de debajo. NO lleva `presentationStyle`:
      // React Native no admite las dos propiedades a la vez y avisa por consola de que la
      // combinación no está soportada.
      transparent
      animationType="slide"
      // El botón físico de volver cierra la hoja, no la pantalla: es lo que se espera en Android.
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/40">
        {/* El velo cierra al tocarlo. Va como pulsable propio y no envolviendo la hoja para que un
            toque dentro del contenido no la cierre por error. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar"
          onPress={onClose}
          className="flex-1"
        />
        <View
          className="max-h-[85%] rounded-t-sheet bg-base-100"
          style={{ paddingBottom: insets.bottom }}
        >
          {/* Asa: dice que la hoja es una capa que se puede retirar, no una pantalla más. */}
          <View className="items-center pt-2.5">
            <View className="h-1 w-10 rounded-full bg-base-300" />
          </View>

          <View className="flex-row items-center justify-between px-5 py-3">
            <Text variant="heading">{title}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              hitSlop={8}
              className="h-9 w-9 items-center justify-center rounded-full active:bg-base-200"
            >
              <Icon glyph={X} size="lg" tone="muted" />
            </Pressable>
          </View>

          <ScrollView
            className="px-5"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>

          {footer ? <View className="gap-2 px-5 pb-2 pt-4">{footer}</View> : null}
        </View>
      </View>
    </Modal>
  )
}
