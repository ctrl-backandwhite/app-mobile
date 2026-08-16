import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { AppError } from '@core/errors/app-error'
import { useContainer } from '@composition/container.provider'
import { Alert, BrandHeader, Button, Card, Divider, PasswordField, Screen, TextField } from '@ds/components'

import { GoogleButton } from '../components/GoogleButton'
import { OtpField } from '../components/OtpField'
import { useSessionStore } from '../state/session.store'

export function LoginScreen(): ReactElement {
  const { signIn, signInWithGoogle } = useContainer()
  const signedIn = useSessionStore((state) => state.signedIn)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [otp, setOtp] = useState('')
  // El segundo factor no es un paso del formulario, es un estado en el que entra tras la primera
  // respuesta del backend: la contraseña ya era correcta.
  const [otpRequired, setOtpRequired] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [googleSubmitting, setGoogleSubmitting] = useState(false)

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

  async function submitWithGoogle(): Promise<void> {
    setGoogleSubmitting(true)
    setError(null)
    try {
      const result = await signInWithGoogle.execute()
      if (!result.ok) {
        // Cancelar no es un fallo que merezca un aviso rojo: la persona ya sabe que ha salido.
        if (result.error.code === 'CANCELLED') return
        setError(result.error.message)
        return
      }
      const { user, accessToken, refreshToken } = result.value
      signedIn(user, accessToken, refreshToken)
      router.replace('/')
    } finally {
      setGoogleSubmitting(false)
    }
  }

  return (
    <Screen padded={false}>
      <BrandHeader subtitle="Tu catálogo mayorista, en el bolsillo" />
      <View className="p-5">
        <Card>
          <Text className="mb-5 font-medium text-[22px] text-base-content">Iniciar sesión</Text>

          {error ? <Alert variant="error" message={error} /> : null}

          <View className="mt-4 gap-4">
            <GoogleButton onPress={submitWithGoogle} loading={googleSubmitting} disabled={submitting} />

            <Divider label="o con tu correo" />

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

            <PasswordField label="Contraseña" value={password} onChangeText={setPassword} />

            {otpRequired ? (
              <OtpField
                value={otp}
                onChangeText={setOtp}
                hint="Ábrelo en tu aplicación de verificación."
              />
            ) : null}

            <Pressable onPress={() => router.push('/password-reset')} accessibilityRole="link">
              <Text className="text-[13px] text-primary">¿Has olvidado tu contraseña?</Text>
            </Pressable>

            <Button title="Entrar" onPress={submit} loading={submitting} disabled={googleSubmitting} />
          </View>
        </Card>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-[13px] text-base-content opacity-70">¿No tienes cuenta?</Text>
          <Pressable onPress={() => router.push('/register')} accessibilityRole="link">
            <Text className="font-medium text-[13px] text-primary">Crear cuenta</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}
