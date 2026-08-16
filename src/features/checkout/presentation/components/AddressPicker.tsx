import { ReactElement } from 'react'
import { Pressable, Text, View } from 'react-native'

import { Address, addressSummary, addressTitle } from '@features/checkout/domain/entities/address'

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
  return (
    <View className="gap-2" testID="address-picker">
      <Text className="text-[13px] font-medium text-base-content">Dirección de envío</Text>

      {loading ? (
        <Text className="py-2 text-[12px] text-base-content opacity-60">Cargando direcciones…</Text>
      ) : null}

      {!loading && addresses.length === 0 ? (
        <Text className="text-[12px] text-base-content opacity-70">
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
                className={`flex-1 text-[13px] ${selected ? 'font-medium text-primary' : 'text-base-content'}`}
              >
                {addressTitle(address)}
              </Text>
              {address.isDefault ? (
                <Text className="text-[10px] text-base-content opacity-60">Predeterminada</Text>
              ) : null}
            </View>
            <Text numberOfLines={2} className="mt-1 text-[11px] text-base-content opacity-70">
              {addressSummary(address)}
            </Text>
            {address.phone ? (
              <Text className="text-[11px] text-base-content opacity-60">{address.phone}</Text>
            ) : null}
          </Pressable>
        )
      })}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Añadir una dirección de envío"
        onPress={onAdd}
        className="rounded-field border border-dashed border-base-300 p-3"
      >
        <Text className="text-[13px] text-primary">Añadir dirección</Text>
      </Pressable>
    </View>
  )
}
