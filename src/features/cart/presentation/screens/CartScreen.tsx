import { useQuery } from '@tanstack/react-query'
import { router, useFocusEffect } from 'expo-router'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { ScrollView, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { useCartCountStore } from '../state/cart-count.store'
import { Alert, Screen, Skeleton } from '@ds/components'
import { CartLine, LineRef, totalUnits } from '@features/cart/domain/entities/cart-line'

import { CartEmptyState, CartLineRow, CartSummary, SavedForLaterList } from '../components'

/**
 * Cesta de la compra.
 *
 * El presupuesto lo calcula siempre el backend a partir de las líneas: la cesta no guarda importes
 * ni los suma. Si lo hiciera, mostraría un total distinto del que se cobra en cuanto cambiara una
 * regla de precio en el servidor, que es justo el desfase que ya se sufrió en el panel web.
 */
export function CartScreen(): ReactElement {
  const { loadCart, loadSavedCart, updateQuantity, removeFromCart, saveForLater, moveToCart, quoteCart } =
    useContainer()

  const setUnits = useCartCountStore((state) => state.setUnits)

  const [lines, setLines] = useState<CartLine[]>([])
  const [saved, setSaved] = useState<CartLine[]>([])
  const [error, setError] = useState<string | null>(null)
  /*
   * Si la cesta se ha leído ya alguna vez.
   *
   * Sin esto, mientras llegaba lo guardado la pantalla decía «Tu cesta está vacía»: quien tenía
   * cinco productos veía primero que no tenía ninguno. Un vacío es una afirmación, y no se puede
   * afirmar antes de haber mirado.
   */
  const [leida, setLeida] = useState(false)

  /*
   * Se recarga CADA VEZ que la pestaña vuelve al frente, no solo al montarse.
   *
   * Las pestañas se quedan montadas: con un efecto de montaje, añadir algo desde la ficha subía el
   * contador de la pestaña y la cesta seguía enseñando lo que había leído la primera vez —vacía—.
   * Solo cerrando y abriendo la aplicación aparecía el producto.
   */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false

      void loadCart.execute().then((stored) => {
        if (cancelled) return
        setLines(stored)
        setLeida(true)
      })

      // Lo guardado vive en el servidor: hay que pedirlo, no basta con lo que haya en el dispositivo.
      // Es lo que hace que apartar un producto desde el panel web se vea también aquí.
      void loadSavedCart.execute().then((result) => {
        if (!cancelled && result.ok) setSaved([...result.value])
      })

      return () => {
        cancelled = true
      }
    }, [loadCart, loadSavedCart]),
  )

  // El distintivo de la pestaña se pone al día con cada cambio: quitar una línea aquí tiene que
  // verse abajo sin salir y volver a entrar.
  useEffect(() => {
    setUnits(totalUnits(lines))
  }, [lines, setUnits])

  // El presupuesto se rehace con cada cambio de la cesta. La clave incluye las cantidades para que
  // subir una unidad devuelva el importe nuevo y no el de la consulta anterior.
  const quoteKey = lines.map((line) => `${line.productId}:${line.variantId ?? ''}:${line.quantity}`)
  const quote = useQuery({
    queryKey: ['cart-quote', quoteKey],
    queryFn: async () => {
      const result = await quoteCart.execute(lines)
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const changeQuantity = useCallback(
    async (ref: LineRef, quantity: number) => {
      setLines(await updateQuantity.execute(ref, quantity))
    },
    [updateQuantity],
  )

  const remove = useCallback(
    async (ref: LineRef) => {
      setLines(await removeFromCart.execute(ref))
    },
    [removeFromCart],
  )

  const keep = useCallback(
    async (ref: LineRef) => {
      setError(null)
      const result = await saveForLater.execute(ref)
      if (!result.ok) {
        // La línea sigue en la cesta: el caso de uso no la quita hasta que el servidor confirma.
        setError(result.error.message)
        return
      }
      setLines([...result.value.lines])
      setSaved([...result.value.saved])
    },
    [saveForLater],
  )

  const restore = useCallback(
    async (line: CartLine) => {
      setError(null)
      const result = await moveToCart.execute(line)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setLines([...result.value.lines])
      setSaved([...result.value.saved])
    },
    [moveToCart],
  )

  // Mientras no se haya leído, huecos con la forma de las líneas. Decir «vacía» antes de mirar es
  // afirmar algo que todavía no se sabe.
  if (!leida) {
    return (
      <Screen edges={['top']}>
        <View className="gap-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </View>
      </Screen>
    )
  }

  if (lines.length === 0 && saved.length === 0) {
    return (
      <Screen edges={['top']}>
        <CartEmptyState onBrowseCatalog={() => router.push('/(app)/(tabs)/catalog')} />
      </Screen>
    )
  }

  return (
    <Screen padded={false} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="gap-3 p-5 pb-32">
        {error ? <Alert variant="error" message={error} /> : null}

        {lines.map((line) => (
          <CartLineRow
            key={`${line.productId}:${line.variantId ?? ''}`}
            line={line}
            quoteLine={quote.data?.items.find(
              (item) => item.productId === line.productId && item.variantId === line.variantId,
            )}
            onQuantityChange={(changed, quantity) =>
              void changeQuantity(
                { productId: changed.productId, variantId: changed.variantId },
                quantity,
              )
            }
            onRemove={(removed) =>
              void remove({ productId: removed.productId, variantId: removed.variantId })
            }
            onSaveForLater={(kept) =>
              void keep({ productId: kept.productId, variantId: kept.variantId })
            }
          />
        ))}

        <SavedForLaterList
          lines={saved}
          onMoveToCart={(line) => void restore(line)}
          onRemove={(line) => void restore(line)}
        />
      </ScrollView>

      {lines.length > 0 ? (
        <View className="absolute bottom-0 left-0 right-0">
          <CartSummary
            quote={quote.data ?? undefined}
            unitCount={totalUnits(lines)}
            onCheckout={() => router.push('/checkout')}
          />
        </View>
      ) : null}
    </Screen>
  )
}
