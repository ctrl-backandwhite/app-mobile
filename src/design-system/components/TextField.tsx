import { ReactElement } from 'react'
import { Text, TextInput, TextInputProps, View } from 'react-native'

import { colors } from '../tokens'

export interface TextFieldProps extends TextInputProps {
  label: string
  error?: string | null
}

export function TextField({ label, error, ...input }: TextFieldProps): ReactElement {
  return (
    <View className="gap-1">
      <Text className="text-[13px] text-base-content opacity-80">{label}</Text>
      <TextInput
        // La etiqueta visible es también el nombre accesible: el lector de pantalla y los tests
        // E2E localizan el campo por el mismo texto que ve la persona usuaria.
        accessibilityLabel={label}
        placeholderTextColor={colors.placeholder}
        className={`h-12 rounded-field border bg-base-100 px-3 text-[15px] text-base-content ${
          error ? 'border-error' : 'border-base-300'
        }`}
        {...input}
      />
      {error ? <Text className="text-[12px] text-error">{error}</Text> : null}
    </View>
  )
}
