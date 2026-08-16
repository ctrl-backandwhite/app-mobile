import { ReactElement } from 'react'
import { Text, View } from 'react-native'

interface Props {
  label: string
}

export function Divider({ label }: Props): ReactElement {
  return (
    <View className="my-4 flex-row items-center gap-3">
      <View className="h-px flex-1 bg-base-300" />
      <Text className="text-[11px] uppercase text-base-content opacity-60">{label}</Text>
      <View className="h-px flex-1 bg-base-300" />
    </View>
  )
}
