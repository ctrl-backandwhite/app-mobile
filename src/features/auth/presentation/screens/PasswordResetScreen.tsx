import { router } from 'expo-router'
import { KeyRound, Lock, Mail } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, PasswordField, Screen, Text, TextField } from '@ds/components'
import { checkPassword } from '@features/auth/domain/policies/password-policy'

import { AuthHeader } from '../components/AuthHeader'
import { PasswordRequirements } from '../components/PasswordRequirements'

type Step = 'request' | 'confirm'

/**
 * El aviso es el mismo tenga cuenta ese correo o no.
 *
 * Contestar «no hay ninguna cuenta con ese correo» convertiría el formulario en un listado de
 * clientes: cualquiera podría comprobar direcciones una a una hasta saber quién está dado de alta.
 */
const NEUTRAL_NOTICE = 'Si ese correo tiene cuenta, recibirás un mensaje con las instrucciones.'

/**
 * Recuperación de contraseña en dos pasos dentro de una sola pantalla.
 *
 * Los dos pasos no son dos rutas porque el segundo no tiene sentido sin el primero: separarlos
 * obligaría a arrastrar el correo entre pantallas y dejaría una ruta a la que se puede llegar sin
 * haber pedido nada.
 */
export function PasswordResetScreen(): ReactElement {
  const { requestPasswordReset, confirmPasswordReset } = useContainer()

  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [password, setPassword] = useState('')
  const [repeated, setRepeated] = useState('')
  const [notice, setNotice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const check = checkPassword(password)
  const mismatched = repeated.length > 0 && repeated !== password
  const canConfirm = token.trim().length > 0 && check.valid && password === repeated

  async function request(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      // El resultado se descarta a propósito: mostrar el fallo del backend delataría qué correos
      // existen, que es justo lo que este flujo evita.
      await requestPasswordReset.execute(email)
      setNotice(NEUTRAL_NOTICE)
      setStep('confirm')
    } finally {
      setSubmitting(false)
    }
  }

  async function confirm(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const result = await confirmPasswordReset.execute(token, password)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      // Sin sesión iniciada: el cambio invalida la anterior y hay que entrar con la nueva.
      router.replace({ pathname: '/login', params: { aviso: 'contrasena-cambiada' } })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <AuthHeader
        subtitle={
          step === 'request'
            ? 'Escribe tu correo y te enviamos un código'
            : 'Pega el código del correo y elige una contraseña nueva'
        }
      />

      {/* Decir en cuál de los dos pasos se está: sin esto, la pantalla cambia de campos de golpe y
          parece que el envío ha fallado y ha vuelto a empezar. */}
      <Text variant="eyebrow" tone="muted">
        {step === 'request' ? 'Paso 1 de 2' : 'Paso 2 de 2'}
      </Text>
      <Text variant="title" className="mb-4">
        {step === 'request' ? 'Recuperar contraseña' : 'Nueva contraseña'}
      </Text>

      {notice ? <Alert variant="info" message={notice} /> : null}
      {error ? (
        <View className={notice ? 'mt-3' : ''}>
          <Alert variant="error" message={error} />
        </View>
      ) : null}

      {step === 'request' ? (
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

          <Button
            title="Enviarme el código"
            onPress={request}
            loading={submitting}
            disabled={email.trim().length === 0}
          />
        </View>
      ) : (
        <View className="mt-4 gap-4">
          {/*
            El correo llega con un enlace a la web que lleva el código; aquí se pega y el recorrido
            se termina sin salir de la aplicación. Abrir esta pantalla ya rellena desde el propio
            enlace exige cambiar la plantilla del correo en el backend para que apunte al esquema de
            la app, y queda para más adelante.
          */}
          <TextField
            label="Código de recuperación"
            icon={KeyRound}
            value={token}
            onChangeText={setToken}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="one-time-code"
            placeholder="El código que has recibido por correo"
          />

          <View>
            <PasswordField
              label="Nueva contraseña"
              icon={Lock}
              value={password}
              onChangeText={setPassword}
              autoComplete="new-password"
            />
            <PasswordRequirements value={password} />
          </View>

          <PasswordField
            label="Repite la contraseña"
            icon={Lock}
            value={repeated}
            onChangeText={setRepeated}
            autoComplete="new-password"
            error={mismatched ? 'Las contraseñas no coinciden.' : null}
          />

          <Button
            title="Cambiar contraseña"
            onPress={confirm}
            loading={submitting}
            disabled={!canConfirm}
          />

          {/* Volver al paso anterior. Sin esta salida, quien se equivoca al teclear el correo no
              recibe ningún código y la única forma de reintentar es salir al acceso y entrar otra
              vez aquí. */}
          <Pressable
            onPress={() => {
              setStep('request')
              setToken('')
              setNotice(null)
              setError(null)
            }}
            accessibilityRole="link"
            className="items-center"
            hitSlop={8}
          >
            <Text variant="label" tone="primary">
              Usar otro correo
            </Text>
          </Pressable>
        </View>
      )}

      <View className="mt-8 flex-row justify-center">
        <Pressable onPress={() => router.replace('/login')} accessibilityRole="link" hitSlop={8}>
          <Text variant="label" tone="primary">
            Volver al acceso
          </Text>
        </Pressable>
      </View>
    </Screen>
  )
}
