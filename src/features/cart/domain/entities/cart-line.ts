/**
 * Línea de la cesta.
 *
 * NO guarda ningún precio, y es deliberado: congelar el importe del instante en que se añadió haría
 * que la app enseñara un total distinto del que se cobra en cuanto cambiara una regla de precio en
 * el servidor. El precio lo dice siempre el backend (`POST /catalog/cart-quote`) y aquí solo vive lo
 * imprescindible para pintar la fila mientras tanto.
 */
export interface CartLine {
  readonly productId: string
  readonly variantId?: string
  readonly slug: string
  readonly title: string
  readonly image?: string
  /** Etiqueta ya compuesta de la variante («Color: Negro / Talla: M»), tal cual se pinta. */
  readonly variantLabel?: string
  readonly sku?: string
  readonly quantity: number
  /** Pedido mínimo del producto: ninguna cantidad de esta línea puede bajar de aquí. */
  readonly moq?: number
}

/** Lo que identifica a una línea: el producto Y la variante elegida. */
export interface LineRef {
  readonly productId: string
  readonly variantId?: string
}

/**
 * «Sin variante» llega de tres formas según quién construya la referencia (ausente, nula o cadena
 * vacía). Sin normalizarlas, la misma línea se comparaba como distinta y acababa duplicada en la
 * cesta con la mitad de las unidades en cada copia.
 */
function normalizeVariantId(variantId?: string): string | undefined {
  return variantId === undefined || variantId === '' ? undefined : variantId
}

/** Cantidad por debajo de la cual la línea no se puede comprar. */
export function minimumQuantity(line: Pick<CartLine, 'moq'>): number {
  return line.moq !== undefined && line.moq > 0 ? line.moq : 1
}

/**
 * Dos referencias apuntan a la misma línea cuando coinciden producto y variante. Dos variantes del
 * mismo producto son líneas distintas: se compran por separado y se envían por separado.
 */
export function sameLine(a: LineRef, b: LineRef): boolean {
  return (
    a.productId === b.productId &&
    normalizeVariantId(a.variantId) === normalizeVariantId(b.variantId)
  )
}

/** La misma línea con otra cantidad, nunca por debajo de su pedido mínimo. */
export function withQuantity(line: CartLine, quantity: number): CartLine {
  // Media unidad no existe: el selector siempre manda enteros, pero una cantidad tecleada podría no
  // serlo y el backend rechazaría el pedido entero al cobrar.
  return { ...line, quantity: Math.max(Math.trunc(quantity), minimumQuantity(line)) }
}

/** Unidades totales de la cesta, que es lo que se pinta en la insignia del icono. */
export function totalUnits(lines: readonly CartLine[]): number {
  return lines.reduce((units, line) => units + line.quantity, 0)
}

export function findLine(lines: readonly CartLine[], ref: LineRef): CartLine | undefined {
  return lines.find((line) => sameLine(line, ref))
}

export function removeLine(lines: readonly CartLine[], ref: LineRef): CartLine[] {
  return lines.filter((line) => !sameLine(line, ref))
}

/**
 * Inserta la línea o, si ya estaba, SUMA sus unidades a la que había.
 *
 * Los datos de pintado (imagen, etiqueta, sku) los gana la recién llegada porque es la que viene de
 * la ficha que la persona acaba de ver; los campos que no traiga conservan lo anterior en vez de
 * borrarlo.
 */
export function upsertLine(lines: readonly CartLine[], incoming: CartLine): CartLine[] {
  const existing = findLine(lines, incoming)
  if (!existing) return [...lines, withQuantity(incoming, incoming.quantity)]

  const merged: CartLine = {
    ...existing,
    ...incoming,
    image: incoming.image ?? existing.image,
    variantLabel: incoming.variantLabel ?? existing.variantLabel,
    sku: incoming.sku ?? existing.sku,
    moq: incoming.moq ?? existing.moq,
    quantity: existing.quantity + incoming.quantity,
  }
  return lines.map((line) => (sameLine(line, incoming) ? withQuantity(merged, merged.quantity) : line))
}
