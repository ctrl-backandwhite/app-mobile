import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Category } from '../entities/category'
import { ProductFilters } from '../entities/filters'
import { Home } from '../entities/home'
import { Page } from '../entities/page'
import { ProductSummary } from '../entities/product'

export interface CatalogRepository {
  /** `page` es base cero y `lang` decide el idioma de títulos y nombres de categoría. */
  listProducts(
    page: number,
    size: number,
    lang: string,
    filters: ProductFilters,
  ): Promise<Result<Page<ProductSummary>, AppError>>
  home(lang: string, perSection: number): Promise<Result<Home, AppError>>
  categoriesTree(lang: string): Promise<Result<Category[], AppError>>
}
