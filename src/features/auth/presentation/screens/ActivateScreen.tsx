import { router, useLocalSearchParams } from 'expo-router'
import { KeyRound, Mail } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Screen, Text, TextField } from '@ds/components'

import { AuthHeader } from '../components/AuthHeader'

/**
 * El backend responde igual exista o no la cuenta, para no revelar qué correos están dados de alta.
 * La pantalla mantiene esa neutralidad: mostrar aquí un fallo delataría justo lo que el backend
 * calla.
 */
const RESEND_NOTICE = 'Si esa cuenta existe, recibirás un código nuevo.'

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
      // El aviso lo da el acceso, no esta pantalla: escribirlo aquí y navegar acto seguido lo
      // dejaba pintado durante un fotograma y nadie llegaba a leerlo.
      router.replace({ pathname: '/login', params: { aviso: 'activada' } })
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
    <Screen>
      <AuthHeader subtitle="Escribe el código que te hemos enviado por correo" />

      <Text variant="title">Activa tu cuenta</Text>

      <View className="mt-4 gap-4">
        {error ? <Alert variant="error" message={error} /> : null}
        {notice ? <Alert variant="success" message={notice} /> : null}

        {emailFromLink ? null : (
          <TextField
            label="Correo electrónico"
            icon={Mail}
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
          icon={KeyRound}
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
          hitSlop={8}
        >
          <Text variant="label" tone="primary">
            Reenviar código
          </Text>
        </Pressable>
      </View>

      <View className="mt-8 flex-row justify-center gap-1">
        <Text variant="label" tone="muted">
          ¿Ya la has activado?
        </Text>
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" hitSlop={8}>
          <Text variant="label" tone="primary">
            Iniciar sesión
          </Text>
        </Pressable>
      </View>
    </Screen>
  )
}
