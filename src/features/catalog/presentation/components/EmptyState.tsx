import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { Button } from '@ds/components'

interface Props {
  title: string
  message: string
  actionLabel?: string
  onAction?: () => void
}

/** Sirve al «no hay resultados» y al error de carga: cambia el texto, no la disposición. */
export function EmptyState({ title, message, actionLabel, onAction }: Props): ReactElement {
  return (
    <View className="items-center gap-2 px-8 py-12">
      {/* Marca decorativa: un aro vacío basta para señalar el hueco sin cargar una ilustración. */}
      <View className="mb-2 h-12 w-12 rounded-full border-2 border-base-300" />
      <Text className="text-center font-medium text-[18px] text-base-content">{title}</Text>
      <Text className="text-center text-[13px] text-base-content opacity-70">{message}</Text>
      {actionLabel && onAction ? (
        <View className="mt-4 self-stretch">
          <Button title={actionLabel} onPress={onAction} variant="outline" />
        </View>
      ) : null}
    </View>
  )
}
