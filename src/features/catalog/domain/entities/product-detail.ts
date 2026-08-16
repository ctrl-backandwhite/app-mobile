import { ProductSummary } from './product'

/**
 * Foto de la ficha.
 *
 * `url` es la que se pinta (la copia espejada en el almacén propio cuando existe) y `sourceUrl` la
 * original del proveedor. Se conservan las dos porque el espejo guarda cada fichero por el hash de
 * su contenido: la foto de galería y el mismo color recortado como muestra dan hashes distintos, y
 * solo la dirección de origen permite reconocer que son la misma imagen.
 */
export interface ProductImage {
  readonly id: string
  readonly url: string
  readonly sourceUrl?: string
  readonly position: number
  /** MAIN, GALLERY, video… El fotograma del vídeo no es una foto y no entra en la galería. */
  readonly role?: string
}

/**
 * Combinación comprable.
 *
 * PRECIOS: cada variante trae LOS SUYOS ya formateados por el backend. No se mezclan nunca con los
 * del producto: la variante parte de un coste distinto, así que el «antes» del producto junto al
 * «ahora» de la variante daba un tachado incoherente, y llegó a pintarse MENOR que el precio
 * rebajado. Aquí no se calcula ni se formatea ningún importe.
 */
export interface ProductVariant {
  readonly id: string
  readonly sku?: string
  readonly title?: string
  /** Precio de ESTA variante, ya formateado por el backend. */
  readonly priceFormatted?: string
  /** Precio ANTERIOR de ESTA variante (el tachado). Solo si la variante está en promoción. */
  readonly originalFormatted?: string
  readonly discountPercent?: number
  readonly stock: number
  readonly imageUrl?: string
  /** Valor elegido en cada eje, indexado por el nombre del eje tal y como lo manda el backend. */
  readonly options: Readonly<Record<string, string>>
  readonly active: boolean
  readonly weightGrams?: number
  readonly lengthMm?: number
  readonly widthMm?: number
  readonly heightMm?: number
}

export interface VariantOptionValue {
  readonly id: string
  readonly value: string
  readonly imageUrl?: string
  /** Dirección original de la foto del valor, necesaria para emparejarla con la galería. */
  readonly imageSourceUrl?: string
  readonly position: number
}

/** Eje de selección: color, talla, modelo… */
export interface VariantOption {
  readonly id: string
  readonly name: string
  readonly position: number
  readonly values: readonly VariantOptionValue[]
}

/** Tramo por cantidad. El importe llega formateado; la app no calcula descuentos por volumen. */
export interface PriceTier {
  readonly minQty: number
  readonly maxQty?: number
  readonly unitPriceFormatted?: string
}

/**
 * Operador económico establecido en la Unión (art. 16.3 del Reglamento (UE) 2023/988). El backend
 * solo lo envía cuando está habilitado y con los datos completos, así que si llega se pinta tal
 * cual; el cargo ya viene traducido en `roleLabel`.
 */
export interface ResponsiblePerson {
  readonly name: string
  readonly addressLine: string
  readonly postalCode?: string
  readonly city: string
  readonly region?: string
  readonly country: string
  readonly email: string
  readonly phone?: string
  readonly roleLabel: string
}

/**
 * Bloque de cumplimiento. El art. 19 del Reglamento (UE) 2023/988 obliga a que la oferta en línea
 * muestre fabricante, persona responsable y advertencias de seguridad: esto se PINTA, no es
 * información interna.
 */
export interface ProductCompliance {
  readonly manufacturerName?: string
  readonly manufacturerAddress?: string
  readonly manufacturerEmail?: string
  /** false si falta algún dato del fabricante. */
  readonly manufacturerComplete: boolean
  /** Advertencias ya resueltas por herencia de categoría y traducidas por el backend. */
  readonly safetyWarnings: readonly string[]
  readonly responsiblePerson?: ResponsiblePerson
}

export interface ProductSpecification {
  readonly key: string
  readonly value: string
  readonly position?: number
}

/**
 * Ficha completa del producto.
 *
 * PRECIOS: igual que en `ProductSummary`, solo campos ya formateados por el backend. El desglose
 * (base, IVA, envío, aduana) no llega al revendedor y por eso no está aquí.
 */
export interface ProductDetail extends ProductSummary {
  readonly description?: string
  readonly brand?: string
  /** Pedido mínimo. Manda sobre la cantidad inicial del selector. */
  readonly moq: number
  readonly reviewCount: number
  readonly videoUrl?: string
  readonly hasVideo?: boolean
  readonly images: readonly ProductImage[]
  readonly variants: readonly ProductVariant[]
  readonly variantOptions: readonly VariantOption[]
  readonly priceTiers: readonly PriceTier[]
  readonly specifications?: readonly ProductSpecification[]
  readonly attributes?: Readonly<Record<string, string>>
  readonly tags?: readonly string[]
  readonly compliance?: ProductCompliance
}

/** Valor elegido en cada eje, indexado por el nombre del eje (`VariantOption.name`). */
export type VariantSelection = Readonly<Record<string, string>>

/**
 * Identificador de una foto de alicdn (p. ej. «O1CN01abc…»). Es el MISMO para la misma imagen
 * aunque la dirección cambie —la de galería y la recortada como muestra de color difieren solo en
 * el sufijo—, así que sirve para reconocerlas como una sola.
 */
const ALICDN_IMAGE_ID = /O1CN[0-9A-Za-z]+/

function imageKey(url: string): string {
  const match = ALICDN_IMAGE_ID.exec(url)
  return match ? match[0] : url
}

function keysOf(image: ProductImage): string[] {
  return [imageKey(image.url), ...(image.sourceUrl ? [imageKey(image.sourceUrl)] : [])]
}

/** Todas las claves de imagen que pertenecen a una variante, vengan del eje o de la combinación. */
function variantImageKeys(detail: ProductDetail): Set<string> {
  const keys = new Set<string>()
  for (const option of detail.variantOptions) {
    for (const value of option.values) {
      if (value.imageUrl) keys.add(imageKey(value.imageUrl))
      if (value.imageSourceUrl) keys.add(imageKey(value.imageSourceUrl))
    }
  }
  for (const variant of detail.variants) {
    if (variant.imageUrl) keys.add(imageKey(variant.imageUrl))
  }
  return keys
}

function chosenValues(selection: VariantSelection): [string, string][] {
  return Object.entries(selection).filter(([, value]) => value.trim().length > 0)
}

function matches(variant: ProductVariant, chosen: readonly [string, string][]): boolean {
  return chosen.every(([axis, value]) => {
    const own = variant.options[axis]
    // El eje puede venir con un nombre distinto en la variante y en el selector (uno traducido y
    // otro no), así que cuando la clave no está se compara por valor, que sí es el mismo texto.
    return own !== undefined ? own === value : Object.values(variant.options).includes(value)
  })
}

/**
 * La variante que casa con TODAS las opciones elegidas.
 *
 * Solo se consideran las activas: una variante desactivada no se puede comprar, y devolverla
 * pintaría precio y existencias de algo que el pedido rechazaría después. Sin ninguna opción
 * elegida no hay variante que devolver; con una elección parcial gana la primera que encaje, que es
 * lo que permite enseñar la foto del color antes de elegir la talla.
 */
export function variantFor(
  detail: ProductDetail,
  selection: VariantSelection,
): ProductVariant | undefined {
  const chosen = chosenValues(selection)
  if (chosen.length === 0) return undefined
  return detail.variants.find((variant) => variant.active && matches(variant, chosen))
}

/**
 * Si hay una elección por cada eje. Un eje sin valores no se puede elegir y no debe bloquear la
 * compra, así que cuenta como resuelto.
 */
export function isSelectionComplete(detail: ProductDetail, selection: VariantSelection): boolean {
  return detail.variantOptions.every((option) => {
    if (option.values.length === 0) return true
    return (selection[option.name] ?? '').trim().length > 0
  })
}

/** Primera variante activa que encaje con la elección y además tenga foto propia. */
function selectedImage(detail: ProductDetail, selection: VariantSelection): ProductVariant | undefined {
  const chosen = chosenValues(selection)
  if (chosen.length === 0) return undefined
  return detail.variants.find(
    (variant) => variant.active && Boolean(variant.imageUrl) && matches(variant, chosen),
  )
}

/**
 * Galería que corresponde a la elección actual.
 *
 * Las fotos propias de una variante de color NO se mezclan con las del producto: la carga guarda la
 * misma imagen en los dos sitios, y sin filtrar salía el mismo color repetido en la tira de
 * miniaturas y en el selector. Al elegir color, su foto encabeza la galería.
 *
 * Salvaguarda: hay fichas cuya galería son EXACTAMENTE las fotos de sus colores (un pañuelo con
 * treinta colores y nada más); filtrarlas la dejaría sin ninguna imagen, y una ficha sin foto es
 * peor que una foto de más, así que en ese caso se devuelve la galería entera.
 */
export function imagesFor(detail: ProductDetail, selection: VariantSelection): ProductImage[] {
  const gallery = detail.images.filter((image) => image.role?.toLowerCase() !== 'video')
  const variantKeys = variantImageKeys(detail)
  const own = gallery.filter((image) => !keysOf(image).some((key) => variantKeys.has(key)))
  const base = own.length > 0 ? own : gallery

  const variant = selectedImage(detail, selection)
  const chosenUrl = variant?.imageUrl
  if (!variant || !chosenUrl) return [...base]

  const key = imageKey(chosenUrl)
  const already = base.find((image) => keysOf(image).includes(key))
  const first: ProductImage = already ?? { id: `${variant.id}-color`, url: chosenUrl, position: 0 }
  return [first, ...base.filter((image) => image !== already)]
}

/**
 * Tramo aplicable a esa cantidad: el de mayor `minQty` que la cantidad alcanza sin pasarse del
 * `maxQty` del tramo, si lo tiene.
 */
export function priceTierFor(detail: ProductDetail, quantity: number): PriceTier | undefined {
  return [...detail.priceTiers]
    .sort((a, b) => a.minQty - b.minQty)
    .filter((tier) => quantity >= tier.minQty && (tier.maxQty === undefined || quantity <= tier.maxQty))
    .pop()
}
