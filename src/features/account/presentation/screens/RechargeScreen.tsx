import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, OptionRow, Screen, Text, TextField } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { RechargeMethod } from '@features/checkout/domain/entities/wallet-recharge'

const METODOS: readonly { valor: RechargeMethod; etiqueta: string; detalle: string }[] = [
  { valor: 'CARD', etiqueta: 'Tarjeta', detalle: 'Débito o crédito' },
  { valor: 'PAYPAL', etiqueta: 'PayPal', detalle: 'Se abre la app o la web de PayPal' },
]

/**
 * Recargar el monedero.
 *
 * <p>El importe se escribe y se envía en la divisa ACTIVA: el dólar canónico y la moneda de cobro los
 * deriva el servidor. Convertir aquí daría dos tipos de cambio distintos —el del teléfono y el del
 * servidor— para un mismo cobro, y el importe que se lee no sería el que se carga.
 *
 * <p>El USDT del escritorio no está: pide enseñar una dirección de cadena con su QR y esperar
 * confirmaciones, que es otro flujo y no el de «recargar y seguir comprando».
 */
export function RechargeScreen(): ReactElement {
  const { getRechargeOptions, rechargeWallet } = useContainer()
  const currency = useSessionStore((s) => s.currency)
  const queryClient = useQueryClient()

  const [metodo, setMetodo] = useState<RechargeMethod>('CARD')
  const [importe, setImporte] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [cancelada, setCancelada] = useState(false)

  const opciones = useQuery({
    queryKey: ['recharge-options', currency],
    queryFn: async () => {
      const result = await getRechargeOptions.execute(currency)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  // La coma decimal es lo que sale del teclado en español; el número no la entiende.
  const cantidad = Number(importe.replace(',', '.'))
  const puedeRecargar = Number.isFinite(cantidad) && cantidad > 0

  const recarga = useMutation({
    mutationFn: async () => {
      const result = await rechargeWallet.execute({ method: metodo, amount: cantidad, currency })
      if (!result.ok) throw result.error
      return result.value
    },
    onSuccess: (resultado) => {
      setError(null)
      if (resultado === 'cancelled') {
        // No es un fallo: es alguien que ha decidido no pagar todavía. El importe se conserva para
        // que reintentar no obligue a teclearlo otra vez.
        setCancelada(true)
        return
      }
      void queryClient.invalidateQueries({ queryKey: ['wallet'] })
      void queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] })
      router.back()
    },
    onError: (e: Error) => {
      setCancelada(false)
      setError(e.message)
    },
  })

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <Card>
          <Text variant="heading" className="mb-1">Cuánto quieres añadir</Text>
          <Text variant="caption" tone="muted" className="mb-3">
            {`El cargo se hace en ${currency}, la divisa que tienes puesta.`}
          </Text>

          {opciones.data && opciones.data.presets.length > 0 ? (
            <View className="mb-3 flex-row flex-wrap gap-2">
              {opciones.data.presets.map((preset) => (
                <Pressable
                  key={preset.amount}
                  testID={`sugerido-${preset.amount}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: cantidad === preset.amount }}
                  onPress={(): void => setImporte(String(preset.amount))}
                  className={`min-h-11 justify-center rounded-field border px-4 ${
                    cantidad === preset.amount
                      ? 'border-primary bg-primary/[0.08]'
                      : 'border-base-300 bg-base-100'
                  }`}
                >
                  <Text variant="label">{preset.formatted}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}

          <TextField
            label="Otro importe"
            testID="importe-recarga"
            value={importe}
            onChangeText={setImporte}
            keyboardType="decimal-pad"
            placeholder="0,00"
          />
        </Card>

        <Card>
          <Text variant="heading" className="mb-3">Cómo lo pagas</Text>
          {METODOS.map((opcion, indice) => (
            <OptionRow
              key={opcion.valor}
              testID={`metodo-${opcion.valor}`}
              label={opcion.etiqueta}
              description={opcion.detalle}
              selected={metodo === opcion.valor}
              last={indice === METODOS.length - 1}
              onPress={(): void => setMetodo(opcion.valor)}
            />
          ))}
        </Card>

        {error ? <Alert variant="error" message={error} /> : null}
        {cancelada ? (
          <Alert variant="info" message="Has salido sin pagar. El saldo no ha cambiado." />
        ) : null}

        <Button
          testID="recargar"
          title="Recargar"
          onPress={(): void => recarga.mutate()}
          disabled={!puedeRecargar}
          loading={recarga.isPending}
        />

        {/* Que la pasarela devuelva algo no significa que el dinero se haya movido: lo cierra el servidor. */}
        <Text variant="caption" tone="muted" className="text-center">
          El saldo se actualiza cuando el pago queda confirmado.
        </Text>
      </ScrollView>
    </Screen>
  )
}
