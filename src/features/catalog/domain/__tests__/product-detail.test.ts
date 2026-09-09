import {
  imagesFor,
  isSelectionComplete,
  isSelectionUnavailable,
  priceTierFor,
  variantFor,
  variantLabelOf,
} from '../entities/product-detail'
import {
  anImage,
  aProductDetail,
  aVariant,
  aVariantOption,
} from '../testing/fake-catalog-repository'

const GALLERY = anImage({
  id: 'i-1',
  url: 'https://cdn.nx036.com/media/aa/gallery.jpg',
  sourceUrl: 'https://cbu01.alicdn.com/img/ibank/O1CN01GALERIA.jpg',
})
/** Misma foto que el color rojo, pero espejada aparte: la dirección de origen es la que empareja. */
const RED_IN_GALLERY = anImage({
  id: 'i-2',
  url: 'https://cdn.nx036.com/media/bb/gallery-rojo.jpg',
  sourceUrl: 'https://cbu01.alicdn.com/img/ibank/O1CN01ROJO.jpg',
  position: 1,
})
const RED_SWATCH = 'https://cdn.nx036.com/media/cc/swatch-rojo.jpg'
const RED_SWATCH_SOURCE = 'https://cbu01.alicdn.com/img/ibank/O1CN01ROJO.cib.jpg'

const COLOR_OPTION = aVariantOption({
  values: [
    { id: 'ov-1', value: 'Rojo', imageUrl: RED_SWATCH, imageSourceUrl: RED_SWATCH_SOURCE, position: 0 },
    { id: 'ov-2', value: 'Azul', position: 1 },
  ],
})
const SIZE_OPTION = aVariantOption({
  id: 'o-2',
  name: 'Talla',
  position: 1,
  values: [
    { id: 'ov-3', value: 'M', position: 0 },
    { id: 'ov-4', value: 'L', position: 1 },
  ],
})

const RED_M = aVariant({ id: 'v-1', options: { Color: 'Rojo', Talla: 'M' }, imageUrl: RED_SWATCH })
const RED_L = aVariant({ id: 'v-2', options: { Color: 'Rojo', Talla: 'L' }, imageUrl: RED_SWATCH })
const BLUE_M = aVariant({ id: 'v-3', options: { Color: 'Azul', Talla: 'M' } })

function aTwoAxisDetail() {
  return aProductDetail({
    images: [GALLERY, RED_IN_GALLERY],
    variants: [RED_M, RED_L, BLUE_M],
    variantOptions: [COLOR_OPTION, SIZE_OPTION],
  })
}

describe('variantFor', () => {
  it('devuelve la variante que casa con todas las opciones elegidas', () => {
    expect(variantFor(aTwoAxisDetail(), { Color: 'Rojo', Talla: 'L' })?.id).toBe('v-2')
  })

  it('con una selección incompleta devuelve la primera variante que encaja', () => {
    expect(variantFor(aTwoAxisDetail(), { Color: 'Rojo' })?.id).toBe('v-1')
  })

  it('sin ninguna opción elegida no hay variante', () => {
    expect(variantFor(aTwoAxisDetail(), {})).toBeUndefined()
  })

  it('ignora los ejes elegidos en blanco', () => {
    expect(variantFor(aTwoAxisDetail(), { Color: 'Azul', Talla: '  ' })?.id).toBe('v-3')
  })

  it('no devuelve nada cuando ninguna combinación encaja', () => {
    expect(variantFor(aTwoAxisDetail(), { Color: 'Verde' })).toBeUndefined()
  })

  it('descarta las variantes desactivadas', () => {
    const detail = aProductDetail({
      variants: [aVariant({ id: 'v-9', options: { Color: 'Rojo' }, active: false })],
    })

    expect(variantFor(detail, { Color: 'Rojo' })).toBeUndefined()
  })

  it('casa por valor cuando el eje llega con otro nombre en la variante', () => {
    const detail = aProductDetail({
      variants: [aVariant({ id: 'v-7', options: { 颜色: 'Rojo' } })],
      variantOptions: [COLOR_OPTION],
    })

    expect(variantFor(detail, { Color: 'Rojo' })?.id).toBe('v-7')
  })
})

describe('isSelectionComplete', () => {
  it('está completa con un valor por cada eje', () => {
    expect(isSelectionComplete(aTwoAxisDetail(), { Color: 'Rojo', Talla: 'M' })).toBe(true)
  })

  it('no está completa si falta un eje', () => {
    expect(isSelectionComplete(aTwoAxisDetail(), { Color: 'Rojo' })).toBe(false)
  })

  it('un valor en blanco no cuenta como elección', () => {
    expect(isSelectionComplete(aTwoAxisDetail(), { Color: 'Rojo', Talla: ' ' })).toBe(false)
  })

  it('un eje sin valores no bloquea la compra', () => {
    const detail = aProductDetail({ variantOptions: [aVariantOption({ values: [] })] })

    expect(isSelectionComplete(detail, {})).toBe(true)
  })

  it('un producto sin ejes está siempre completo', () => {
    expect(isSelectionComplete(aProductDetail({ variantOptions: [] }), {})).toBe(true)
  })
})

describe('imagesFor', () => {
  it('deja fuera de la galería las fotos propias de un color', () => {
    const images = imagesFor(aTwoAxisDetail(), {})

    expect(images.map((image) => image.id)).toEqual(['i-1'])
  })

  it('no incluye el fotograma del vídeo', () => {
    const detail = aProductDetail({
      images: [GALLERY, anImage({ id: 'i-video', role: 'video', sourceUrl: undefined })],
      variants: [],
      variantOptions: [],
    })

    expect(imagesFor(detail, {}).map((image) => image.id)).toEqual(['i-1'])
  })

  it('devuelve la galería completa si al filtrar se quedaría vacía', () => {
    // Ficha cuyas únicas fotos son las de sus colores: sin salvaguarda no quedaría ninguna, y una
    // ficha sin imagen es peor que una foto de más.
    const detail = aProductDetail({
      images: [RED_IN_GALLERY],
      variants: [RED_M],
      variantOptions: [COLOR_OPTION],
    })

    expect(imagesFor(detail, {}).map((image) => image.id)).toEqual(['i-2'])
  })

  it('pone primero la foto del color elegido cuando no está en la galería', () => {
    const images = imagesFor(aTwoAxisDetail(), { Color: 'Rojo' })

    expect(images[0]?.url).toBe(RED_SWATCH)
    expect(images[1]?.id).toBe('i-1')
    expect(images).toHaveLength(2)
  })

  it('el color elegido encabeza la galería sin repetirse', () => {
    const detail = aProductDetail({
      images: [RED_IN_GALLERY, anImage({ id: 'i-3', url: RED_SWATCH, position: 1 })],
      variants: [RED_M],
      variantOptions: [COLOR_OPTION],
    })

    const images = imagesFor(detail, { Color: 'Rojo' })

    expect(images.map((image) => image.id)).toEqual(['i-3', 'i-2'])
  })

  it('un color sin foto propia no altera la galería', () => {
    const images = imagesFor(aTwoAxisDetail(), { Color: 'Azul' })

    expect(images.map((image) => image.id)).toEqual(['i-1'])
  })

  it('una foto sin dirección de origen se compara por la suya propia', () => {
    const sinOrigen = anImage({ id: 'i-4', url: RED_SWATCH, sourceUrl: undefined })
    const detail = aProductDetail({
      images: [GALLERY, sinOrigen],
      variants: [RED_M],
      variantOptions: [COLOR_OPTION],
    })

    expect(imagesFor(detail, {}).map((image) => image.id)).toEqual(['i-1'])
  })

  it('una ficha sin ninguna imagen devuelve una galería vacía', () => {
    expect(imagesFor(aProductDetail({ images: [] }), {})).toEqual([])
  })
})

describe('priceTierFor', () => {
  const detail = aProductDetail({
    priceTiers: [
      { minQty: 50, unitPriceFormatted: '9,90 €' },
      { minQty: 1, maxQty: 9, unitPriceFormatted: '12,90 €' },
      { minQty: 10, maxQty: 49, unitPriceFormatted: '11,20 €' },
    ],
  })

  it('elige el tramo aplicable a la cantidad aunque lleguen desordenados', () => {
    expect(priceTierFor(detail, 12)?.unitPriceFormatted).toBe('11,20 €')
  })

  it('el último tramo se aplica sin límite superior', () => {
    expect(priceTierFor(detail, 5000)?.unitPriceFormatted).toBe('9,90 €')
  })

  it('respeta el tope del tramo', () => {
    expect(priceTierFor(detail, 9)?.unitPriceFormatted).toBe('12,90 €')
    expect(priceTierFor(detail, 10)?.unitPriceFormatted).toBe('11,20 €')
  })

  it('no hay tramo por debajo de la cantidad mínima', () => {
    const withMinimum = aProductDetail({ priceTiers: [{ minQty: 5, unitPriceFormatted: '9,90 €' }] })

    expect(priceTierFor(withMinimum, 4)).toBeUndefined()
  })

  it('no hay tramo cuando el producto no tiene ninguno', () => {
    expect(priceTierFor(aProductDetail(), 10)).toBeUndefined()
  })
})

/**
 * Un eje puede ofrecer un valor que ya no tiene variante activa detrás. Antes se podía añadir a la
 * cesta: la línea se guardaba SIN variante y el pedido salía sin saber qué se había comprado.
 */
describe('isSelectionUnavailable', () => {
  const CON_DOS_COLORES = aProductDetail({
    variantOptions: [
      aVariantOption({
        values: [
          { id: 'ov-1', value: 'Negro', position: 0 },
          { id: 'ov-2', value: 'Blanco', position: 1 },
        ],
      }),
    ],
    variants: [aVariant({ options: { Color: 'Blanco' } })],
  })

  it('un color sin variante activa detrás no se puede comprar', () => {
    expect(isSelectionUnavailable(CON_DOS_COLORES, { Color: 'Negro' })).toBe(true)
  })

  it('el color que sí tiene variante se puede comprar', () => {
    expect(isSelectionUnavailable(CON_DOS_COLORES, { Color: 'Blanco' })).toBe(false)
  })

  it('sin haber elegido todavía no se bloquea nada', () => {
    expect(isSelectionUnavailable(CON_DOS_COLORES, {})).toBe(false)
  })

  it('una variante desactivada cuenta como no disponible', () => {
    const retirado = aProductDetail({
      variants: [aVariant({ options: { Color: 'Rojo' }, active: false })],
    })

    expect(isSelectionUnavailable(retirado, { Color: 'Rojo' })).toBe(true)
  })

  it('un producto sin ejes que elegir sigue siendo comprable', () => {
    const sinEjes = aProductDetail({ variantOptions: [], variants: [] })

    expect(isSelectionUnavailable(sinEjes, {})).toBe(false)
  })
})

/**
 * `variant.title` viene relleno con el TÍTULO DEL PRODUCTO, así que usarlo dejaba la cesta sin
 * decir en ningún sitio qué color se había comprado.
 */
describe('variantLabelOf', () => {
  it('nombra la variante por sus opciones, no por su título', () => {
    const variante = aVariant({
      title: 'Tanga de encaje calado con tiro bajo para mujer',
      options: { Color: 'Blanco', Talla: 'L' },
    })

    expect(variantLabelOf(variante)).toBe('Blanco / L')
  })

  it('sin variante no hay etiqueta', () => {
    expect(variantLabelOf(undefined)).toBeUndefined()
  })

  it('una variante sin opciones tampoco tiene etiqueta que enseñar', () => {
    expect(variantLabelOf(aVariant({ options: {} }))).toBeUndefined()
  })
})
