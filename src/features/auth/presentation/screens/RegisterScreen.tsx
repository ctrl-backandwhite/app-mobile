import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { checkPassword } from '@features/auth/domain/policies/password-policy'
import { Alert, BrandHeader, Button, Card, PasswordField, Screen, TextField } from '@ds/components'

import { PasswordRequirements } from '../components/PasswordRequirements'

interface Region {
  country: string
  language: string
}

/**
 * Deduce país e idioma del dispositivo.
 *
 * Si el entorno no expone una región reconocible se dejan en blanco a propósito: un campo vacío se
 * revisa antes de enviar, mientras que una suposición prerrellenada se acepta sin mirar.
 */
function detectRegion(): Region {
  try {
    const [language = '', ...rest] = Intl.DateTimeFormat().resolvedOptions().locale.split('-')
    // La región puede no ser el segundo tramo: en `zh-Hans-CN` el segundo es el sistema de escritura.
    const region = rest.find((part: string) => /^([A-Za-z]{2}|\d{3})$/.test(part)) ?? ''
    return { country: region.toUpperCase(), language: language.toLowerCase() }
  } catch {
    return { country: '', language: '' }
  }
}

const DETECTED = detectRegion()

interface CheckboxProps {
  label: string
  checked: boolean
  onToggle: () => void
}

/**
 * Casilla dibujada con vistas: el sistema de diseño no incluye ninguna y la aplicación no incorpora
 * familias de iconos, igual que el ojo de `PasswordField`.
 */
function Checkbox({ label, checked, onToggle }: CheckboxProps): ReactElement {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked }}
      onPress={onToggle}
      hitSlop={6}
      className="flex-row items-start gap-3"
    >
      <View
        className={`mt-px h-5 w-5 items-center justify-center rounded-selector border ${
          checked ? 'border-primary bg-primary' : 'border-base-300 bg-base-100'
        }`}
      >
        {checked ? <Text className="text-[12px] text-primary-content">✓</Text> : null}
      </View>
      <Text className="flex-1 text-[13px] text-base-content">{label}</Text>
    </Pressable>
  )
}

export function RegisterScreen(): ReactElement {
  const { register } = useContainer()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [country, setCountry] = useState(DETECTED.country)
  const [language, setLanguage] = useState(DETECTED.language)
  // Ninguna de las dos casillas arranca marcada: un consentimiento premarcado no es consentimiento.
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [marketingOptIn, setMarketingOptIn] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // El caso de uso rechazaría igualmente una contraseña débil, pero dejar el botón inerte evita
  // gastar el CAPTCHA y una llamada de red para saber lo que ya se sabe aquí.
  const ready = checkPassword(password).valid && acceptedTerms

  async function submit(): Promise<void> {
    setSubmitting(true)
    setError(null)
    try {
      const result = await register.execute({
        email,
        password,
        firstName: firstName.trim() || undefined,
        companyName: companyName.trim() || undefined,
        country: country.trim() || undefined,
        language: language.trim() || undefined,
        acceptedTerms,
        marketingOptIn,
      })
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      router.replace('/activate')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen padded={false}>
      <BrandHeader subtitle="Crea tu cuenta de revendedor" />
      <View className="p-5">
        <Card>
          <Text className="mb-5 font-medium text-[22px] text-base-content">Crea tu cuenta</Text>

          {error ? <Alert variant="error" message={error} /> : null}

          <View className="mt-4 gap-4">
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

            <View>
              <PasswordField
                label="Contraseña"
                value={password}
                onChangeText={setPassword}
                autoComplete="new-password"
                textContentType="newPassword"
              />
              <PasswordRequirements value={password} />
            </View>

            <TextField
              label="Nombre"
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
              autoComplete="given-name"
            />

            <TextField
              label="Empresa (opcional)"
              value={companyName}
              onChangeText={setCompanyName}
              autoCapitalize="words"
            />

            <TextField
              label="País"
              value={country}
              onChangeText={setCountry}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={2}
              placeholder="ES"
            />

            <TextField
              label="Idioma"
              value={language}
              onChangeText={setLanguage}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={2}
              placeholder="es"
            />

            <View className="gap-3">
              <Checkbox
                label="Acepto los términos y condiciones"
                checked={acceptedTerms}
                onToggle={() => setAcceptedTerms((previous: boolean): boolean => !previous)}
              />
              <Checkbox
                label="Quiero recibir novedades y ofertas por correo"
                checked={marketingOptIn}
                onToggle={() => setMarketingOptIn((previous: boolean): boolean => !previous)}
              />
            </View>

            <Button title="Crear cuenta" onPress={submit} loading={submitting} disabled={!ready} />
          </View>
        </Card>

        <View className="mt-6 flex-row justify-center gap-1">
          <Text className="text-[13px] text-base-content opacity-70">¿Ya tienes cuenta?</Text>
          <Pressable onPress={() => router.push('/login')} accessibilityRole="link">
            <Text className="font-medium text-[13px] text-primary">Iniciar sesión</Text>
          </Pressable>
        </View>
      </View>
    </Screen>
  )
}
