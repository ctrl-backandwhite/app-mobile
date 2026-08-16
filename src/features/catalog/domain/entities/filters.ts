export type ProductSort =
  | 'best_match'
  | 'trending'
  | 'price_asc'
  | 'price_desc'
  | 'newest'
  | 'sales'
  | 'rating'

/**
 * Filtros del escaparate. Deliberadamente NO incluye `verified`: ese filtro es de la revisión
 * manual del panel de administración y el backend lo ignora para quien no es admin, así que
 * ofrecerlo en la aplicación del revendedor solo daría un control que no hace nada.
 */
export interface ProductFilters {
  readonly q?: string
  readonly categoryId?: string
  readonly minPrice?: number
  readonly maxPrice?: number
  readonly hasVideo?: boolean
  readonly minRating?: number
  readonly sort?: ProductSort
}
