import { router, useLocalSearchParams } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, BrandHeader, Button, Card, Screen, TextField } from '@ds/components'

/**
 * El backend responde igual exista o no la cuenta, para no revelar qué correos están dados de alta.
 * La pantalla mantiene esa neutralidad: mostrar aquí un fallo delataría justo lo que el backend
 * calla.
 */
const RESEND_NOTICE = 'Si esa cuenta existe, recibirás un código nuevo.'

const SUCCESS_NOTICE = 'Cuenta activada. Ya puedes iniciar sesión.'

export function ActivateScreen(): ReactElement {
  const { activateAccount, resendActivation } = useContainer()
  const params = useLocalSearchParams()
  // El correo llega del registro o de un enlace; un parámetro repetido llegaría como lista y no sirve.
  const emailFromLink = typeof params.email === 'string' ? params.email : ''

  const [email, setEmail] = useState(emailFromLink)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  async function activate(): Promise<void> {
    setSubmitting(true)
    setError(null)
    setNotice(null)
    try {
      // El código se teclea o se pega desde el correo, así que los espacios de los extremos sobran.
      const result = await activateAccount.execute(code.trim())
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setNotice(SUCCESS_NOTICE)
      router.replace('/login')
    } finally {
      setSubmitting(false)
    }
  }

  async function resend(): Promise<void> {
    if (email.trim().length === 0) {
      setError('Escribe el correo con el que creaste la cuenta.')
      return
    }
    setResending(true)
    setError(null)
    setNotice(null)
    try {
      await resendActivation.execute(email)
    } finally {
      // El aviso es el mismo con éxito y con fallo: el resultado real no debe poder deducirse.
      setNotice(RESEND_NOTICE)
      setResending(false)
    }
  }

  return (
    <Screen padded={false}>
      <BrandHeader subtitle="Ya casi está: confirma tu correo" />
      <View className="p-5">
        <Card>
          <Text className="mb-2 font-medium text-[22px] text-base-content">Activa tu cuenta</Text>
          <Text className="text-[13px] text-base-content opacity-70">
            Introduce el código que te hemos enviado por correo.
          </Text>

          <View className="mt-4 gap-4">
            {error ? <Alert variant="error" message={error} /> : null}
            {notice ? <Alert variant="success" message={notice} /> : null}

            {emailFromLink ? null : (
              <TextField
                label="Correo electrónico"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                placeholder="tucorreo@ejemplo.com"
              />
            )}

            <TextField
              label="Código de activación"
              value={code}
              onChangeText={setCode}
              keyboardType="number-pad"
              autoComplete="one-time-code"
              textContentType="oneTimeCode"
              autoFocus
              style={{ textAlign: 'center', letterSpacing: 6 }}
            />

            <Button
              title="Activar cuenta"
              onPress={activate}
              loading={submitting}
              disabled={code.trim().length === 0}
            />

            <Pressable
              onPress={resend}
              disabled={resending}
              accessibilityRole="link"
              className="items-center"
            >
              <Text className="text-[13px] text-primary">Reenviar código</Text>
            </Pressable>
          </View>
        </Card>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-[13px] text-base-content opacity-70">¿Ya la has activado?</Text>
          <Pressable onPress={() => router.replace('/login')} accessibilityRole="link">
            <Text className="font-medium text-[13px] text-primary">Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}
