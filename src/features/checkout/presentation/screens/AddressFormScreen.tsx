import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement, useCallback, useState } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Alert, Button, Screen, TextField } from '@ds/components'
import { isCompleteAddress, NewAddress } from '@features/checkout/domain/entities/address'
import { checkoutErrorMessage } from '@features/checkout/domain/policies/checkout-errors'

import { useCheckoutDeps } from '../hooks/use-checkout-deps'

const EMPTY: NewAddress = { fullName: '', line1: '', city: '', country: '' }

/**
 * Alta de una dirección de envío.
 *
 * El país se teclea como código de dos letras y no se elige de una lista porque la cobertura real
 * de destinos la sirve el backend, y esta fase no consume ese endpoint: es preferible un campo
 * explicado que una lista inventada aquí que no coincida con lo que se puede enviar.
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
        <TextField
          label="País (código de dos letras)"
          value={form.country}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={2}
          placeholder="ES"
          onChangeText={(value): void => set('country', value.toUpperCase())}
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
            <Text className="text-[13px] text-base-content opacity-80">Provincia o estado</Text>
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
                    <Text className={`text-[12px] ${selected ? 'text-primary' : 'text-base-content'}`}>
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

        <Pressable
          accessibilityRole="checkbox"
          accessibilityLabel="Usar como dirección predeterminada"
          accessibilityState={{ checked: form.isDefault === true }}
          onPress={(): void => set('isDefault', !form.isDefault)}
          className="flex-row items-center gap-2 py-1"
        >
          <View
            className={`h-5 w-5 items-center justify-center rounded-selector border ${
              form.isDefault ? 'border-primary bg-primary' : 'border-base-300 bg-base-100'
            }`}
          >
            {form.isDefault ? <Text className="text-[12px] text-primary-content">✓</Text> : null}
          </View>
          <Text className="text-[13px] text-base-content">Usar como dirección predeterminada</Text>
        </Pressable>

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
