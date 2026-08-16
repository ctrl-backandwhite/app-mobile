import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

import { Category } from '../entities/category'
import { ProductFilters } from '../entities/filters'
import { Home } from '../entities/home'
import { Page } from '../entities/page'
import { ProductSummary } from '../entities/product'
import { ProductDetail } from '../entities/product-detail'
import { Review } from '../entities/review'

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
  /** La ficha se pide por `slug`, que es lo que viaja en el enlace profundo y en la URL del web. */
  productBySlug(slug: string, lang: string): Promise<Result<ProductDetail, AppError>>
  /** Las opiniones ya llegan traducidas por el backend, de ahí que no lleven idioma. */
  reviews(productId: string, page: number, size: number): Promise<Result<Page<Review>, AppError>>
  relatedProducts(
    productId: string,
    lang: string,
    limit: number,
  ): Promise<Result<ProductSummary[], AppError>>
}
