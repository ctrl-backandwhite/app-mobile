import { router, useLocalSearchParams } from 'expo-router'
import { ArrowRight, Lock, Mail } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable, View } from 'react-native'

import { AppError } from '@core/errors/app-error'
import { useContainer } from '@composition/container.provider'
import { Alert, Button, PasswordField, Screen, Text, TextField } from '@ds/components'

import { AuthHeader } from '../components/AuthHeader'
import { OtpField } from '../components/OtpField'
import { useSessionStore } from '../state/session.store'

/**
 * Lo que se acaba de conseguir en la pantalla anterior, para decirlo aquí.
 *
 * Se pasa una CLAVE y no el texto: a esta ruta se llega también desde un enlace externo, y aceptar
 * una frase suelta dejaría escribir cualquier cosa —«tu cuenta ha sido bloqueada, llama a este
 * número»— sobre nuestro formulario de acceso. Lo que no esté en esta tabla no se enseña.
 */
const AVISOS: Readonly<Record<string, string>> = {
  activada: 'Cuenta activada. Ya puedes entrar.',
  'contrasena-cambiada': 'Contraseña cambiada. Entra con la nueva.',
}

/**
 * Acceso.
 *
 * Es la primera pantalla de la marca y por eso está desnuda: el logotipo, dos campos y un botón
 * sobre papel liso. No hay tarjeta ni degradado porque no hay nada que agrupar —una sola cosa no
 * forma grupo— y el adorno solo restaría a lo único que importa aquí, que es entrar.
 */
export function LoginScreen(): ReactElement {
  const { signIn } = useContainer()
  const signedIn = useSessionStore((state) => state.signedIn)
  const params = useLocalSearchParams()
  const aviso = typeof params.aviso === 'string' ? AVISOS[params.aviso] : undefined

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  // El segundo factor no es un paso del formulario, es un estado en el que entra tras la primera
  // respuesta del backend: la contraseña ya era correcta.
  const [otpRequired, setOtpRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function handleFailure(failure: AppError): void {
    if (failure.code === 'MFA_REQUIRED') {
      // Sin mensaje de error: no ha fallado nada, solo falta el código.
      setOtpRequired(true)
      setError(null)
      return
    }
    if (failure.code === 'MFA_INVALID') {
      setOtpRequired(true)
      setError(failure.message)
      return
    }
    if (failure.code === 'INVALID_CREDENTIALS') {
      // La contraseña dejó de valer: volver al paso anterior y descartar el código, que ya no aplica.
      setOtpRequired(false)
      setOtp('')
    }
    setError(failure.message)
  }

  async function submit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const result = await signIn.execute({
        email,
        password,
        otp: otpRequired ? otp : undefined,
      })
      if (!result.ok) {
        handleFailure(result.error)
        return
      }
      const { user, accessToken, refreshToken } = result.value
      signedIn(user, accessToken, refreshToken)
      router.replace('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen centered>
      <AuthHeader subtitle="Tu catálogo mayorista, en el bolsillo" />

      {error ? <Alert variant="error" message={error} /> : null}
      {!error && aviso ? <Alert variant="success" message={aviso} /> : null}

      <View className="mt-4 gap-4">
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

        <PasswordField label="Contraseña" icon={Lock} value={password} onChangeText={setPassword} />

        {otpRequired ? (
          <OtpField
            value={otp}
            onChangeText={setOtp}
            hint="Ábrelo en tu aplicación de verificación."
          />
        ) : null}

        <Pressable
          onPress={() => router.push('/password-reset')}
          accessibilityRole="link"
          className="self-end"
          hitSlop={8}
        >
          <Text variant="label" tone="primary">
            ¿Has olvidado tu contraseña?
          </Text>
        </Pressable>

        <Button title="Entrar" onPress={submit} loading={submitting} trailingIcon={ArrowRight} />
      </View>

      <View className="mt-8 flex-row justify-center gap-1">
        <Text variant="label" tone="muted">
          ¿No tienes cuenta?
        </Text>
        <Pressable onPress={() => router.push('/register')} accessibilityRole="link" hitSlop={8}>
          <Text variant="label" tone="primary">
            Crear cuenta
          </Text>
        </Pressable>
      </View>
    </Screen>
  )
}
