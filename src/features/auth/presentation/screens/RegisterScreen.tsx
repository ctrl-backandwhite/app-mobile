import { router } from 'expo-router'
import { Building2, Lock, Mail, User } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Linking, Pressable, View } from 'react-native'

import { useAppConfig, useContainer } from '@composition/container.provider'
import { checkPassword } from '@features/auth/domain/policies/password-policy'
import { Alert, Button, Checkbox, PasswordField, Screen, Text, TextField } from '@ds/components'

import { LanguageField } from '@features/account/presentation/components'
import { CountryField } from '@features/checkout/presentation/components'

import { LEGAL_LINKS, LEGAL_VERSION } from '@shared/legal/legal'

import { AuthHeader } from '../components/AuthHeader'
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

interface EnlaceLegalProps {
  etiqueta: string
  ruta: string
}

/**
 * Abre un documento legal en el navegador del sistema.
 *
 * No se duplican los textos dentro de la aplicación a propósito: existirían dos versiones del mismo
 * documento y la de la app se quedaría atrás en la siguiente revisión, que es justo lo que no puede
 * pasar con aquello que el usuario declara haber aceptado.
 */
function EnlaceLegal({ etiqueta, ruta }: EnlaceLegalProps): ReactElement {
  const config = useAppConfig()

  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => {
        // Si el navegador no puede abrirse no hay nada que hacer aquí, pero tumbar el registro por
        // ello sería peor: la casilla sigue siendo válida y la cuenta se puede crear igual.
        void Linking.openURL(`${config.webBaseUrl}${ruta}`).catch(() => undefined)
      }}
    >
      <Text variant="label" tone="primary" className="underline">
        {etiqueta}
      </Text>
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
        // La versión que el usuario tuvo delante. El backend la exige y la rechaza vacía.
        acceptedTermsVersion: LEGAL_VERSION,
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
    <Screen>
      <AuthHeader subtitle="Crea tu cuenta de revendedor" />

      {error ? <Alert variant="error" message={error} /> : null}

      <View className="mt-2 gap-4">
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

        <View>
          <PasswordField
            label="Contraseña"
            icon={Lock}
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
          />
          <PasswordRequirements value={password} />
        </View>

        <TextField
          label="Nombre"
          icon={User}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
          autoComplete="given-name"
        />

        <TextField
          label="Empresa (opcional)"
          icon={Building2}
          value={companyName}
          onChangeText={setCompanyName}
          autoCapitalize="words"
        />

        {/*
          Los dos se eligen de una lista y ya no se teclean. El país decide el margen y los impuestos
          de la cuenta, así que un «ES» mal escrito no era un detalle: se apuntaba tal cual y salía
          después en cada precio. La detección del teléfono sigue rellenándolos de entrada.
        */}
        <CountryField
          testID="pais-de-la-cuenta"
          label="País"
          placeholder="Elige tu país"
          value={country}
          onChange={setCountry}
        />
        <LanguageField value={language} onChange={setLanguage} />

        <View className="gap-3">
          <Checkbox
            label="Acepto los términos y condiciones y la política de privacidad"
            checked={acceptedTerms}
            onToggle={() => setAcceptedTerms((previous: boolean): boolean => !previous)}
          >
            {/*
              Los documentos tienen que poder leerse ANTES de marcar la casilla. Aceptar algo que no
              se puede consultar no es consentimiento informado, y la casilla sola no lo era: hasta
              aquí la pantalla no ofrecía forma de abrir ninguno de los dos textos.
            */}
            <View className="flex-row flex-wrap items-center gap-x-3">
              <EnlaceLegal etiqueta="Leer los términos" ruta={LEGAL_LINKS.terminos} />
              <EnlaceLegal etiqueta="Leer la privacidad" ruta={LEGAL_LINKS.privacidad} />
            </View>
          </Checkbox>
          <Checkbox
            label="Quiero recibir novedades y ofertas por correo"
            checked={marketingOptIn}
            onToggle={() => setMarketingOptIn((previous: boolean): boolean => !previous)}
          />
        </View>

        <Button title="Crear cuenta" onPress={submit} loading={submitting} disabled={!ready} />
      </View>

      <View className="mt-8 flex-row justify-center gap-1">
        <Text variant="label" tone="muted">
          ¿Ya tienes cuenta?
        </Text>
        <Pressable onPress={() => router.push('/login')} accessibilityRole="link" hitSlop={8}>
          <Text variant="label" tone="primary">
            Iniciar sesión
          </Text>
        </Pressable>
      </View>
    </Screen>
  )
}
