/** Tramo de una lista paginada del backend. `page` es base cero, igual que en la API. */
export interface Page<T> {
  readonly items: readonly T[]
  readonly page: number
  readonly size: number
  readonly totalElements: number
  readonly totalPages: number
}

/**
 * Si queda página siguiente. Se calcula con `totalPages` y no con el número de elementos recibidos
 * porque la última página puede venir llena y aun así ser la última.
 */
export function hasNextPage<T>(page: Page<T>): boolean {
  return page.page + 1 < page.totalPages
}
