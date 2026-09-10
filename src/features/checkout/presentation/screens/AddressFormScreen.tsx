import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement, useCallback, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Alert, Button, Checkbox, Screen, Text, TextField } from '@ds/components'
import { isCompleteAddress, NewAddress } from '@features/checkout/domain/entities/address'
import { checkoutErrorMessage } from '@features/checkout/domain/policies/checkout-errors'

import { CountryField } from '../components/CountryField'
import { useCheckoutDeps } from '../hooks/use-checkout-deps'

const EMPTY: NewAddress = { fullName: '', line1: '', city: '', country: '' }

/**
 * Alta de una dirección de envío.
 *
 * El país se elige de la cobertura real del transportista, no se teclea: un código escrito a mano se
 * acepta sin rechistar y el fallo asoma mucho después —al cotizar el envío—, con la dirección ya
 * guardada y el pedido a medias.
 */
export function AddressFormScreen(): ReactElement {
  const { createAddress, listRegions } = useCheckoutDeps()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<NewAddress>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const set = useCallback(<K extends keyof NewAddress>(key: K, value: NewAddress[K]): void => {
    setForm((current) => ({ ...current, [key]: value }))
  }, [])

  const country = form.country.trim()

  const regions = useQuery({
    queryKey: ['shipping-regions', country],
    enabled: country.length === 2,
    queryFn: async () => {
      const result = await listRegions.execute(country)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const save = useCallback(async () => {
    if (saving) return
    setSaving(true)
    setError(null)
    try {
      const result = await createAddress.execute(form)
      if (!result.ok) {
        setError(checkoutErrorMessage(result.error))
        return
      }
      // La compra lee la libreta con esta misma clave: invalidarla hace que la dirección recién
      // creada aparezca ya seleccionable al volver.
      await queryClient.invalidateQueries({ queryKey: ['checkout-addresses'] })
      router.back()
    } finally {
      setSaving(false)
    }
  }, [createAddress, form, queryClient, saving])

  const available = regions.data ?? []

  return (
    <Screen>
      <View className="gap-4 pb-6">
        <TextField
          label="Etiqueta"
          value={form.label ?? ''}
          placeholder="Casa, oficina…"
          onChangeText={(value): void => set('label', value)}
        />
        <TextField
          label="Nombre y apellidos"
          value={form.fullName}
          onChangeText={(value): void => set('fullName', value)}
        />
        <TextField
          label="Teléfono"
          value={form.phone ?? ''}
          keyboardType="phone-pad"
          onChangeText={(value): void => set('phone', value)}
        />
        <CountryField
          testID="pais-de-entrega"
          value={form.country}
          onChange={(code): void => {
            // La provincia pertenece al país anterior: dejarla puesta guardaría una dirección con
            // una región que su país no reconoce, y el impuesto se calcularía sobre la equivocada.
            setForm((current) => ({ ...current, country: code, state: undefined }))
          }}
        />
        <TextField
          label="Dirección"
          value={form.line1}
          onChangeText={(value): void => set('line1', value)}
        />
        <TextField
          label="Piso, puerta, referencia"
          value={form.line2 ?? ''}
          onChangeText={(value): void => set('line2', value)}
        />
        <TextField
          label="Ciudad"
          value={form.city}
          onChangeText={(value): void => set('city', value)}
        />

        {available.length > 0 ? (
          <View className="gap-2">
            <Text variant="label" tone="muted">Provincia o estado</Text>
            <View className="flex-row flex-wrap gap-2">
              {available.map((region) => {
                const selected = form.state === region.code
                return (
                  <Pressable
                    key={region.code}
                    accessibilityRole="radio"
                    accessibilityLabel={region.name}
                    accessibilityState={{ selected, checked: selected }}
                    onPress={(): void => set('state', region.code)}
                    className={`rounded-selector border px-3 py-2 ${
                      selected ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-100'
                    }`}
                  >
                    <Text variant="caption" tone={selected ? 'primary' : 'default'}>
                      {region.name}
                    </Text>
                  </Pressable>
                )
              })}
            </View>
          </View>
        ) : (
          // Sin regiones curadas el campo es libre: la mayoría de países no las tienen y exigirlas
          // dejaría la dirección sin provincia.
          <TextField
            label="Provincia o estado"
            value={form.state ?? ''}
            onChangeText={(value): void => set('state', value)}
          />
        )}

        <TextField
          label="Código postal"
          value={form.postalCode ?? ''}
          onChangeText={(value): void => set('postalCode', value)}
        />

        <Checkbox
          label="Usar como dirección predeterminada"
          checked={form.isDefault === true}
          onToggle={(): void => set('isDefault', !form.isDefault)}
        />

        {error ? <Alert variant="error" message={error} /> : null}

        <Button
          title="Guardar dirección"
          loading={saving}
          disabled={!isCompleteAddress(form)}
          onPress={(): void => void save()}
        />
        <Button title="Cancelar" variant="ghost" onPress={(): void => router.back()} />
      </View>
    </Screen>
  )
}
