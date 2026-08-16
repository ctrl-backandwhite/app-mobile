import { ReactElement, ReactNode } from 'react'
import { View } from 'react-native'

interface Props {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: Props): ReactElement {
  return (
    <View className={`rounded-box border border-base-300 bg-base-100 p-5 shadow-sm ${className}`}>
      {children}
    </View>
  )
}
