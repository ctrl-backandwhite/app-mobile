import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ShieldCheck, TicketPercent } from 'lucide-react-native'
import { ReactElement, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Screen, Text, TextField } from '@ds/components'
import { CartLine, totalUnits } from '@features/cart/domain/entities/cart-line'
import { defaultAddress } from '@features/checkout/domain/entities/address'
import {
  CheckoutDraft,
  CheckoutItem,
  missingRequirements,
  shippingCountry,
  shippingRegion,
} from '@features/checkout/domain/entities/checkout-draft'
import {
  defaultPaymentMethod,
  PaymentSelection,
  savedCardId,
  selectionFor,
} from '@features/checkout/domain/entities/payment-method'
import { blocksOrder } from '@features/checkout/domain/entities/shipping'
import { hasEnoughBalance } from '@features/checkout/domain/entities/wallet'
import { checkoutErrorMessage, CHECKOUT_MESSAGES } from '@features/checkout/domain/policies/checkout-errors'
import { checkoutIdempotencyKey } from '@features/checkout/domain/policies/idempotency'

import { AddressPicker, OrderSummary, PaymentPicker } from '../components'
import { useCheckoutDeps } from '../hooks/use-checkout-deps'

function toItem(line: CartLine): CheckoutItem {
  return { productId: line.productId, variantId: line.variantId, quantity: line.quantity }
}

/**
 * Compra: destino, importes y pago.
 *
 * Ningún importe se calcula aquí. Todo —portes, aduana, impuesto y total— viene de la cotización del
 * backend, que es la misma que factura; la app solo pinta lo que recibe y deja un guion donde
 * todavía no hay dato.
 */
export function CheckoutScreen(): ReactElement {
  const { loadCart, clearCart } = useContainer()
  const {
    listAddresses,
    listPaymentMethods,
    getWalletBalance,
    quoteShipping,
    placeOrder,
    payWithSavedCard,
    payWithProvider,
  } = useCheckoutDeps()

  const [lines, setLines] = useState<CartLine[]>([])
  /**
   * Lo ELEGIDO a mano. La propuesta inicial se deriva al pintar, no se copia al estado con un
   * efecto: copiarla obligaría a un segundo render y, peor, a decidir cuándo deja de ser válida.
   */
  const [chosenAddressId, setChosenAddressId] = useState<string | undefined>(undefined)
  const [chosenPayment, setChosenPayment] = useState<PaymentSelection | undefined>(undefined)
  const [couponInput, setCouponInput] = useState('')
  const [coupon, setCoupon] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [placing, setPlacing] = useState(false)

  /**
   * Cerrojo síncrono contra el doble envío. El `disabled` del botón depende del estado y llega un
   * ciclo tarde: una doble pulsación rápida entraría dos veces antes de que React lo desactive.
   */
  const submitting = useRef(false)

  useEffect(() => {
    let cancelled = false
    loadCart.execute().then((stored) => {
      if (!cancelled) setLines(stored)
    })
    return () => {
      cancelled = true
    }
  }, [loadCart])

  const items = useMemo(() => lines.map(toItem), [lines])

  /**
   * La clave del intento se calcula UNA vez por contenido de la cesta, al abrir el resumen, y no en
   * cada pulsación: es lo que hace que un reintento tras un corte de red sea el mismo pedido y no
   * un segundo cobro.
   */
  const idempotencyKey = useMemo(() => checkoutIdempotencyKey(items), [items])

  const addresses = useQuery({
    queryKey: ['checkout-addresses'],
    queryFn: async () => {
      const result = await listAddresses.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const methods = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      const result = await listPaymentMethods.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const wallet = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const result = await getWalletBalance.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  // Propuestas iniciales: la dirección predeterminada y el método de pago marcado por defecto. Sin
  // método guardado se propone el monedero, que es el único que la app cobra de principio a fin.
  const proposedPayment = useMemo((): PaymentSelection | undefined => {
    if (!methods.data) return undefined
    const preferred = defaultPaymentMethod(methods.data)
    return preferred ? selectionFor(preferred) : { kind: 'WALLET' }
  }, [methods.data])

  const addressId = chosenAddressId ?? defaultAddress(addresses.data ?? [])?.id
  const payment = chosenPayment ?? proposedPayment

  const address = addresses.data?.find((candidate) => candidate.id === addressId)
  const country = shippingCountry({ address })
  const region = shippingRegion({ address })
  const itemsKey = items.map((item) => `${item.productId}:${item.variantId ?? ''}:${item.quantity}`)

  const quote = useQuery({
    queryKey: ['shipping-quote', country, region, coupon, itemsKey],
    enabled: Boolean(country) && items.length > 0,
    queryFn: async () => {
      const result = await quoteShipping.execute({
        country,
        region,
        items,
        couponCode: coupon || undefined,
      })
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const acceptedCoupon = quote.data?.couponCode
  const draft = useMemo<CheckoutDraft>(
    () => ({
      address,
      payment,
      // Solo viaja el cupón que la cotización ha ACEPTADO: mandar uno rechazado haría que el backend
      // lo revalidara y volviera a rechazarlo, esta vez tumbando el pedido entero.
      couponCode: acceptedCoupon,
      notes: notes.trim() || undefined,
    }),
    [acceptedCoupon, address, notes, payment],
  )

  const walletEnough = hasEnoughBalance(wallet.data, quote.data?.subtotalUsdCents)
  const missing = missingRequirements(draft)
  const blocked = blocksOrder(quote.data)
  const walletShort = payment?.kind === 'WALLET' && !walletEnough
  const confirmDisabled =
    placing || items.length === 0 || missing.length > 0 || blocked || walletShort

  const confirm = useCallback(async () => {
    if (submitting.current) return
    submitting.current = true
    setPlacing(true)
    setError(null)

    try {
      const placed = await placeOrder.execute({
        draft,
        items,
        idempotencyKey,
        wallet: wallet.data,
        requiredUsdCents: quote.data?.subtotalUsdCents,
      })
      if (!placed.ok) {
        setError(checkoutErrorMessage(placed.error))
        return
      }

      // Tarjeta guardada: el cobro va DESPUÉS de crear el pedido y contra su identificador, igual
      // que en el panel web. Si el cobro falla, la cesta se queda intacta para poder reintentar.
      const cardId = savedCardId(draft.payment)
      if (cardId) {
        const paid = await payWithSavedCard.execute(placed.value.id, cardId)
        if (!paid.ok) {
          setError(checkoutErrorMessage(paid.error))
          return
        }
        if (paid.value.status !== 'paid') {
          setError(CHECKOUT_MESSAGES.cardAuthentication)
          return
        }
      }

      // PayPal: el pedido nace pendiente y el cobro se autoriza fuera de la app. Se abre su página,
      // y al volver se confirma contra el backend — que el navegador diga «aprobado» solo significa
      // que se pulsó el botón; quien sabe si el dinero llegó es el servidor.
      if (draft.payment?.kind === 'PAYPAL') {
        const paid = await payWithProvider.execute(placed.value.id, 'PAYPAL')
        if (!paid.ok) {
          setError(checkoutErrorMessage(paid.error))
          return
        }
        if (paid.value === 'cancelled') {
          // Cancelar no es un fallo: el pedido queda pendiente y se puede reintentar sin rehacer la
          // cesta, así que tampoco se vacía.
          setError(CHECKOUT_MESSAGES.paypalCancelled)
          return
        }
      }

      await clearCart.execute()
      router.replace(`/orders/${placed.value.id}`)
    } finally {
      submitting.current = false
      setPlacing(false)
    }
  }, [
    clearCart,
    draft,
    idempotencyKey,
    items,
    payWithProvider,
    payWithSavedCard,
    placeOrder,
    quote.data?.subtotalUsdCents,
    wallet.data,
  ])

  const units = totalUnits(lines)

  return (
    <Screen>
      {items.length === 0 ? (
        <View className="mt-4">
          <Alert variant="info" message="Tu cesta está vacía: no hay nada que tramitar." />
        </View>
      ) : (
        <Text
          accessibilityLabel={`${units} unidades en la cesta`}
          variant="label"
          tone="muted"
          className="mt-1"
        >
          {units === 1 ? '1 unidad' : `${units} unidades`}
        </Text>
      )}

      <View className="mt-6 gap-6 pb-6">
        <Paso numero={1} titulo="Envío">
          <AddressPicker
            addresses={addresses.data ?? []}
            selectedId={addressId}
            loading={addresses.isLoading}
            onSelect={(chosen): void => setChosenAddressId(chosen.id)}
            onAdd={(): void => router.push('/checkout/address')}
          />

          {addresses.isError ? (
            <Alert variant="error" message="No se han podido cargar tus direcciones." />
          ) : null}
        </Paso>

        <Paso numero={2} titulo="Pago">
          <PaymentPicker
            methods={methods.data ?? []}
            selection={payment}
            wallet={wallet.data}
            walletEnough={walletEnough}
            loading={methods.isLoading}
            onSelect={setChosenPayment}
            onAddCard={(): void => router.push('/checkout/add-card')}
          />
        </Paso>

        <Paso numero={3} titulo="Resumen">
          {/* El cupón va junto al total y no al principio: solo tiene sentido cuando ya se sabe
              sobre qué importe se aplica. */}
          <View className="flex-row items-end gap-2">
            <View className="flex-1">
              <TextField
                label="Cupón"
                icon={TicketPercent}
                value={couponInput}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="Código de descuento"
                onChangeText={(value): void => setCouponInput(value.toUpperCase())}
              />
            </View>
            <Button
              title="Aplicar"
              variant="outline"
              block={false}
              disabled={!couponInput.trim() || couponInput.trim() === coupon}
              onPress={(): void => setCoupon(couponInput.trim())}
            />
          </View>
          {quote.data?.couponError ? (
            <Alert variant="warning" message={quote.data.couponError} />
          ) : null}
          {quote.data?.couponCode ? (
            <Text variant="caption" tone="success">
              Cupón {quote.data.couponCode} aplicado.
            </Text>
          ) : null}

          <OrderSummary quote={quote.data} loading={quote.isFetching} />

          {quote.isError ? (
            <Alert variant="error" message="No se ha podido calcular el envío. Inténtalo de nuevo." />
          ) : null}

          <TextField
            label="Notas para el pedido"
            value={notes}
            multiline
            placeholder="Indicaciones de entrega (opcional)"
            onChangeText={setNotes}
          />
        </Paso>

        {error ? <Alert variant="error" message={error} /> : null}

        {/* Decir qué falta evita el botón gris sin explicación, que es donde se abandona la compra. */}
        {missing.includes('address') ? (
          <Text variant="caption" tone="error">
            {CHECKOUT_MESSAGES.noAddress}
          </Text>
        ) : null}
        {missing.includes('payment') ? (
          <Text variant="caption" tone="error">
            {CHECKOUT_MESSAGES.noPayment}
          </Text>
        ) : null}
        {payment?.kind === 'PAYPAL' ? (
          <Text variant="caption" tone="muted">
            {CHECKOUT_MESSAGES.paypalRedirect}
          </Text>
        ) : null}

        <Button
          title="Confirmar pedido"
          icon={ShieldCheck}
          loading={placing}
          disabled={confirmDisabled}
          onPress={(): void => void confirm()}
        />
      </View>
    </Screen>
  )
}

interface PasoProps {
  numero: number
  titulo: string
  children: ReactNode
}

/**
 * Un paso de la compra.
 *
 * Va numerado porque la compra SÍ es una secuencia —sin dirección no hay portes, sin portes no hay
 * total— y el número dice cuánto queda. Antes los tres bloques colgaban seguidos con el mismo peso y
 * la pantalla se leía como un formulario largo en lugar de como un recorrido con final.
 */
function Paso({ numero, titulo, children }: PasoProps): ReactElement {
  return (
    <View className="gap-3">
      <View className="flex-row items-center gap-2.5">
        <View className="h-6 w-6 items-center justify-center rounded-full bg-primary">
          <Text variant="caption" tone="inverse">
            {numero}
          </Text>
        </View>
        <Text variant="heading">{titulo}</Text>
      </View>
      {children}
    </View>
  )
}
