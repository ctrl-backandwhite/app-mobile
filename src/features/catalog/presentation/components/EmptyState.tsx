import { LucideIcon, PackageOpen } from 'lucide-react-native'
import { ReactElement } from 'react'
import { View } from 'react-native'

import { Button, Icon, Text } from '@ds/components'

interface Props {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
  /** Icono del hueco. Por omisión, la caja abierta: no hay nada dentro. */
  icon?: LucideIcon
}

/** Sirve al «no hay resultados» y al error de carga: cambia el texto, no la disposición. */
export function EmptyState({
  title,
  message,
  actionLabel,
  onAction,
  icon = PackageOpen,
}: Props): ReactElement {
  return (
    // Centrado en el hueco disponible: pegado arriba dejaba media pantalla en blanco debajo y el
    // aviso parecía un resto de la lista anterior en vez del contenido de la pantalla.
    <View className="flex-1 items-center justify-center gap-2 px-8 py-12">
      {/* El icono va dentro de un disco tenue: sobre el fondo liso, un trazo suelto se lee como un
          error de pintado en vez de como una ilustración. */}
      <View className="mb-3 h-16 w-16 items-center justify-center rounded-full bg-base-300">
        <Icon glyph={icon} size="xl" tone="muted" />
      </View>
      <Text variant="heading" className="text-center">
        {title}
      </Text>
      <Text variant="label" tone="muted" className="text-center">
        {message}
      </Text>
      {actionLabel && onAction ? (
        <View className="mt-5 self-stretch">
          <Button title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  )
}
