import { CardField, CardFieldInput } from '@stripe/stripe-react-native'
import { useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement, useCallback, useState } from 'react'
import { Text, View } from 'react-native'

import { Alert, Button, Screen, TextField } from '@ds/components'
import { colors } from '@ds/tokens'
import { acceptsCards } from '@features/checkout/domain/entities/billing-config'
import { checkoutErrorMessage } from '@features/checkout/domain/policies/checkout-errors'

import { useBillingConfig } from '../hooks/use-billing-config'
import { useCheckoutDeps } from '../hooks/use-checkout-deps'

/**
 * El campo de tarjeta es un componente NATIVO del SDK: no entiende `className`, así que su tamaño y
 * sus colores viajan por las propiedades que él expone. El marco que lo rodea sí es de NativeWind.
 */
const FIELD_SIZE = { width: '100%', height: 46 } as const

const FIELD_COLORS: CardFieldInput.Styles = {
  backgroundColor: colors.light.base100,
  textColor: colors.light.baseContent,
  placeholderColor: colors.placeholder,
  textErrorColor: colors.light.error,
  fontSize: 15,
}

const UNAVAILABLE = 'El pago con tarjeta no está disponible ahora mismo. Inténtalo más tarde.'

/**
 * Alta de una tarjeta en el perfil.
 *
 * Los datos de la tarjeta no pasan por esta pantalla ni por el backend: se teclean en el formulario
 * del SDK, que los manda directamente a la pasarela. Lo único que sale de aquí es el nombre del
 * titular; el backend se queda solo con la referencia opaca del método guardado.
 */
export function AddCardScreen(): ReactElement {
  const { addCard } = useCheckoutDeps()
  const queryClient = useQueryClient()
  const config = useBillingConfig()

  const [holder, setHolder] = useState('')
  const [cardComplete, setCardComplete] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await addCard.execute(holder)
      if (!result.ok) {
        setError(checkoutErrorMessage(result.error))
        return
      }
      // La compra lee los métodos con esta misma clave: invalidarla hace que la tarjeta recién
      // guardada aparezca ya elegible al volver, sin recargar la pantalla a mano.
      await queryClient.invalidateQueries({ queryKey: ['payment-methods'] })
      router.back()
    } finally {
      setSaving(false)
    }
  }, [addCard, holder, queryClient, saving])

  const ready = acceptsCards(config.data)

  return (
    <Screen>
      <View className="gap-4 pb-6">
        <Text className="text-[20px] font-medium text-base-content">Nueva tarjeta</Text>

        {config.isLoading ? (
          <Text className="text-[13px] text-base-content opacity-70">
            Preparando el formulario de pago…
          </Text>
        ) : null}

        {/* Sin clave de la pasarela no hay formulario que enseñar: pintarlo llevaría a teclear una
            tarjeta entera para descubrir al guardar que este entorno no cobra con tarjeta. */}
        {!config.isLoading && !ready ? <Alert variant="error" message={UNAVAILABLE} /> : null}

        {ready ? (
          <>
            <TextField
              label="Nombre del titular"
              value={holder}
              autoCapitalize="words"
              autoComplete="cc-name"
              placeholder="Como aparece en la tarjeta"
              onChangeText={setHolder}
            />

            <View className="gap-1">
              <Text className="text-[13px] text-base-content opacity-80">Datos de la tarjeta</Text>
              <View className="rounded-field border border-base-300 bg-base-100 px-2">
                <CardField
                  accessibilityLabel="Datos de la tarjeta"
                  // El código postal lo aporta la dirección de envío; pedirlo otra vez alarga el
                  // formulario sin aportar nada, igual que en el panel web.
                  postalCodeEnabled={false}
                  style={FIELD_SIZE}
                  cardStyle={FIELD_COLORS}
                  onCardChange={(details: CardFieldInput.Details): void =>
                    setCardComplete(details.complete)
                  }
                />
              </View>
            </View>

            {error ? <Alert variant="error" message={error} /> : null}

            <Button
              title="Guardar tarjeta"
              loading={saving}
              disabled={!holder.trim() || !cardComplete}
              onPress={(): void => void save()}
            />
          </>
        ) : null}

        <Button title="Cancelar" variant="ghost" onPress={(): void => router.back()} />
      </View>
    </Screen>
  )
}
