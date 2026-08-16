import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { Alert, TextField } from '@ds/components'

interface Props {
  value: string
  onChangeText: (value: string) => void
  hint?: string
}

/**
 * Campo del código de un solo uso. Va aparte del formulario general porque solo aparece cuando el
 * backend responde que la cuenta tiene segundo factor, y porque necesita un teclado y un espaciado
 * distintos: seis dígitos separados se leen mucho mejor al teclearlos desde otra aplicación.
 */
export function OtpField({ value, onChangeText, hint }: Props): ReactElement {
  return (
    <View className="gap-2">
      <Alert variant="info" message="Esta cuenta pide un código de verificación." />
      <TextField
        label="Código de verificación"
        value={value}
        onChangeText={onChangeText}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        style={{ textAlign: 'center', letterSpacing: 8 }}
      />
      {hint ? <Text className="text-[11px] text-base-content opacity-60">{hint}</Text> : null}
    </View>
  )
}
