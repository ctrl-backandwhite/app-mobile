import { MapPinPlus } from 'lucide-react-native'
import { ReactElement } from 'react'
import { Pressable, View } from 'react-native'

import { Badge, Icon, Skeleton, Text } from '@ds/components'

import { Address, addressSummary, addressTitle } from '@features/checkout/domain/entities/address'

import { useCountryNames } from '../hooks/use-country-name'

interface Props {
  addresses: readonly Address[]
  selectedId?: string
  loading?: boolean
  onSelect: (address: Address) => void
  onAdd: () => void
}

export function AddressPicker({
  addresses,
  selectedId,
  loading = false,
  onSelect,
  onAdd,
}: Props): ReactElement {
  const nombreDelPais = useCountryNames()

  return (
    <View className="gap-2" testID="address-picker">
      <Text variant="label">Dirección de envío</Text>

      {loading ? (
        <View className="gap-2">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </View>
      ) : null}

      {!loading && addresses.length === 0 ? (
        <Text variant="caption" tone="muted">
          Todavía no tienes ninguna dirección guardada.
        </Text>
      ) : null}

      {addresses.map((address) => {
        const selected = address.id === selectedId
        return (
          <Pressable
            key={address.id}
            accessibilityRole="radio"
            accessibilityState={{ selected, checked: selected }}
            accessibilityLabel={`Enviar a ${addressTitle(address)}`}
            onPress={(): void => onSelect(address)}
            className={`rounded-field border p-3 ${
              selected ? 'border-primary bg-primary/10' : 'border-base-300 bg-base-100'
            }`}
          >
            <View className="flex-row items-center justify-between gap-2">
              <Text
                numberOfLines={1}
                variant="label"
                tone={selected ? 'primary' : 'default'}
                className="flex-1"
              >
                {addressTitle(address)}
              </Text>
              {address.isDefault ? <Badge label="Predeterminada" /> : null}
            </View>
            <Text numberOfLines={2} variant="caption" tone="muted" className="mt-1">
              {addressSummary(address, nombreDelPais(address.country))}
            </Text>
            {address.phone ? (
              <Text variant="caption" tone="muted">
                {address.phone}
              </Text>
            ) : null}
          </Pressable>
        )
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir una dirección de envío"
        onPress={onAdd}
        className="flex-row items-center gap-2 rounded-field border border-dashed border-base-300 p-3 active:opacity-70"
      >
        <Icon glyph={MapPinPlus} size="md" tone="primary" />
        <Text variant="label" tone="primary" className="shrink-0">
          Añadir dirección
        </Text>
      </Pressable>
    </View>
  )
}
