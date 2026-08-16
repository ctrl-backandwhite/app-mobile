import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { ProductFilters } from '../entities/filters'
import { Page } from '../entities/page'
import { ProductSummary } from '../entities/product'
import { CatalogRepository } from '../ports/catalog-repository'

/** Una rejilla de dos columnas llena varias pantallas con este tamaño sin encadenar peticiones. */
const DEFAULT_SIZE = 24
/**
 * El tamaño de página lo decide el cliente, no el servidor, así que conviene acotarlo aquí: una
 * petición de cientos de fichas tarda más de lo que el usuario espera y se descarta al desplazarse.
 */
const MAX_SIZE = 60
const MIN_SIZE = 1

export interface BrowseProductsInput {
  readonly page?: number
  readonly size?: number
  readonly lang?: string
  readonly filters?: ProductFilters
}

export class BrowseProducts {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(input: BrowseProductsInput = {}): Promise<Result<Page<ProductSummary>, AppError>> {
    const { page = 0, size = DEFAULT_SIZE, lang = 'es', filters = {} } = input
    // Un término con solo espacios no es una búsqueda: enviarlo haría que el backend ordenara por
    // relevancia sobre nada y devolviera un listado distinto al de navegar sin buscar.
    const q = filters.q?.trim() || undefined
    const normalized: ProductFilters = { ...filters, q }
    return this.repository.listProducts(page, this.clamp(size), lang, normalized)
  }

  private clamp(size: number): number {
    return Math.min(Math.max(Math.trunc(size), MIN_SIZE), MAX_SIZE)
  }
}
