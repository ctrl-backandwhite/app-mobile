import { useCallback, useState } from 'react'

import { useContainer } from '@composition/container.provider'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import {
  firstAvailableVariant,
  variantLabelOf,
} from '@features/catalog/domain/entities/product-detail'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { useSyncCartCount } from './use-sync-cart-count'

interface CompraRapida {
  /** Añade el producto a la cesta con una unidad. */
  add: (product: ProductSummary) => void
  /** Producto recién añadido, para que su tarjeta lo diga durante unos segundos. */
  addedId?: string
  /** Por qué no se ha podido añadir, en palabras de quien compra. */
  error?: string
}

/** Cuánto tiempo se queda el botón en «Añadido» antes de volver a ofrecerse. */
const AVISO_MS = 2000

const SIN_EXISTENCIAS = 'Se ha agotado. Entra en la ficha para ver si queda otra opción.'
const NO_SE_PUDO = 'No se ha podido añadir a la cesta. Inténtalo de nuevo.'

/**
 * Añadir a la cesta desde una tarjeta, sin entrar en la ficha.
 *
 * <p>La tarjeta no trae variantes, así que se pide la ficha y se toma la PRIMERA con existencias,
 * igual que hace el escaparate. Guardar la línea sin variante metería en la cesta algo que el pedido
 * no sabe servir: es el mismo fallo que ya se corrigió en la ficha, donde se llegó a comprar sin
 * elegir color.
 *
 * <p>Si no queda ninguna, no se añade nada y se dice por qué: agotarse no es un fallo del sistema,
 * es una respuesta que hay que dar en palabras de quien compra.
 */
export function useQuickAdd(): CompraRapida {
  const { addToCart, getProductDetail } = useContainer()
  const locale = useSessionStore((state) => state.locale)
  const refreshCount = useSyncCartCount()
  const [addedId, setAddedId] = useState<string | undefined>(undefined)
  const [error, setError] = useState<string | undefined>(undefined)

  const add = useCallback(
    (product: ProductSummary): void => {
      setError(undefined)
      void getProductDetail
        .execute(product.slug, locale)
        .then((resultado) => {
          if (!resultado.ok) {
            setError(NO_SE_PUDO)
            return
          }
          const detalle = resultado.value
          const variante = firstAvailableVariant(detalle)
          // Con ejes y sin ninguna variante servible, no hay nada que añadir.
          if (detalle.variantOptions.length > 0 && !variante) {
            setError(SIN_EXISTENCIAS)
            return
          }

          const line: CartLine = {
            productId: product.id,
            variantId: variante?.id,
            slug: product.slug,
            title: product.title,
            image: product.mainImage,
            variantLabel: variantLabelOf(variante),
            sku: variante?.sku,
            quantity: detalle.moq,
            moq: detalle.moq,
            // El servidor los exige al guardar la línea; el importe que se cobra lo recalcula él.
            unitPriceSource: product.displayPrice,
            sourceCurrency: product.displayCurrency,
          }
          return addToCart.execute(line).then(() => {
            setAddedId(product.id)
            // El distintivo de la pestaña sube en el acto: es la única señal fuera de la tarjeta.
            refreshCount()
            setTimeout(() => setAddedId(undefined), AVISO_MS)
          })
        })
        .catch(() => setError(NO_SE_PUDO))
    },
    [addToCart, getProductDetail, locale, refreshCount],
  )

  return { add, addedId, error }
}
