import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { MapPinPlus, MapPinned } from 'lucide-react-native'
import { ReactElement } from 'react'
import { View } from 'react-native'

import { Badge, Button, Card, Screen, Skeleton, Text } from '@ds/components'
import { addressSummary, addressTitle } from '@features/checkout/domain/entities/address'
import { EmptyState } from '@features/catalog/presentation/components'

import { useCountryNames } from '../hooks/use-country-name'
import { useCheckoutDeps } from '../hooks/use-checkout-deps'

/**
 * La libreta de direcciones de la cuenta.
 *
 * <p>Existía en el backend y en el escritorio, pero en la aplicación solo se llegaba a ella DENTRO
 * de una compra: para ver o dar de alta una dirección había que empezar un pedido. Aquí se consulta
 * y se amplía sin nada en la cesta.
 *
 * <p>Solo lista y añade, que es lo que permite el contrato: modificar o borrar tocaría una dirección
 * que puede estar enviando un pedido en curso, y ese mantenimiento vive en el escritorio.
 */
export function AddressBookScreen(): ReactElement {
  const { listAddresses } = useCheckoutDeps()
  // Antes de los primeros `return`: los hooks se piden siempre, y esta pantalla se va por dos
  // caminos cortos —cargando y error— antes de llegar a la lista.
  const nombreDelPais = useCountryNames()

  const addresses = useQuery({
    queryKey: ['addresses'],
    queryFn: async () => {
      const result = await listAddresses.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  if (addresses.isLoading) {
    return (
      <Screen>
        <View className="gap-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </View>
      </Screen>
    )
  }

  if (addresses.isError) {
    return (
      <Screen>
        <EmptyState
          icon={MapPinned}
          title="No se han podido cargar tus direcciones"
          message="Comprueba tu conexión e inténtalo de nuevo."
          actionLabel="Reintentar"
          onAction={() => void addresses.refetch()}
        />
      </Screen>
    )
  }

  const items = addresses.data ?? []

  return (
    <Screen>
        <Text variant="caption" tone="muted" className="mb-2">
          Las mismas que usa el escritorio. Aquí eliges a dónde llegan tus pedidos.
        </Text>

      {items.length === 0 ? (
        <EmptyState
          icon={MapPinned}
          title="Aún no tienes direcciones"
          message="Da de alta la primera y la tendrás lista para tu próximo pedido."
          actionLabel="Añadir dirección"
          onAction={() => router.push('/checkout/address')}
        />
      ) : (
        <View className="gap-3">
          {items.map((address) => (
            <Card key={address.id} padding="sm" className="gap-1.5">
              <View className="flex-row items-center justify-between gap-2">
                <Text numberOfLines={1} variant="label" className="flex-1">
                  {addressTitle(address)}
                </Text>
                {address.isDefault ? <Badge label="Predeterminada" tone="primary" /> : null}
              </View>
              <Text variant="caption" tone="muted">
                {addressSummary(address, nombreDelPais(address.country))}
              </Text>
              {address.phone ? (
                <Text variant="caption" tone="muted">
                  {address.phone}
                </Text>
              ) : null}
            </Card>
          ))}

          <View className="mt-2">
            <Button
              title="Añadir dirección"
              icon={MapPinPlus}
              variant="outline"
              onPress={() => router.push('/checkout/address')}
            />
          </View>
        </View>
      )}
    </Screen>
  )
}
