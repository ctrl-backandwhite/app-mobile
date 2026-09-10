import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from './Text'

interface Props {
  label: string
}

export function Divider({ label }: Props): ReactElement {
  return (
    <View className="my-4 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-base-300" />
      <Text variant="eyebrow" tone="muted">
        {label}
      </Text>
      <View className="h-px flex-1 bg-base-300" />
    </View>
  )
}
