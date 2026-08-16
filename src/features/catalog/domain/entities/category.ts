/**
 * Nodo del árbol de categorías. En este catálogo los productos cuelgan de las subcategorías, así
 * que un nodo raíz suele traer `directProductCount` a cero y todo su contenido en `children`.
 */
export interface Category {
  readonly id: string
  readonly slug: string
  readonly name: string
  readonly parentId?: string
  readonly position: number
  readonly icon?: string
  /** Productos colgados directamente de esta categoría, sin contar los de sus hijas. */
  readonly directProductCount?: number
  readonly children?: readonly Category[]
}
