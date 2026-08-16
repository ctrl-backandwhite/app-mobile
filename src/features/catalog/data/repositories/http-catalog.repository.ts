import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { HttpClient } from '@core/http/http-client'
import { err, ok, Result } from '@core/result/result'
import { Category } from '@features/catalog/domain/entities/category'
import { ProductFilters } from '@features/catalog/domain/entities/filters'
import { Home } from '@features/catalog/domain/entities/home'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'
import { CatalogRepository } from '@features/catalog/domain/ports/catalog-repository'

import { categoryTreeDto, homeSectionsDto, productPageDto } from '../dto/catalog.dto'
import { toCategory } from '../mappers/category.mapper'
import { toProductPage, toProductSummary } from '../mappers/product.mapper'

/** Zod señala sus fallos con este nombre; comprobarlo evita acoplarse a la clase concreta. */
function isSchemaViolation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

export class HttpCatalogRepository implements CatalogRepository {
  constructor(private readonly http: HttpClient) {}

  /**
   * Envuelve una llamada al backend: traduce cualquier fallo a `AppError` y valida el contrato.
   * Una respuesta que no cumple el esquema se convierte en un error `CONTRACT` explícito en lugar
   * de un valor incompleto que reventaría más adelante.
   */
  private async call<T>(
    operation: () => Promise<unknown>,
    parse: (raw: unknown) => T,
  ): Promise<Result<T, AppError>> {
    try {
      return ok(parse(await operation()))
    } catch (error) {
      if (isSchemaViolation(error)) {
        return err(new AppError('CONTRACT', 'La respuesta del servidor no tiene el formato esperado.'))
      }
      return err(mapHttpError(error))
    }
  }

  async listProducts(
    page: number,
    size: number,
    lang: string,
    filters: ProductFilters,
  ): Promise<Result<Page<ProductSummary>, AppError>> {
    return this.call(
      // Los filtros van sueltos junto a la paginación, como espera el backend. Axios omite los que
      // valen `undefined`, así que un filtro sin usar no viaja en la URL.
      () => this.http.get('/catalog/products', { params: { page, size, lang, ...filters } }),
      (raw) => toProductPage(productPageDto.parse(raw)),
    )
  }

  async home(lang: string, perSection: number): Promise<Result<Home, AppError>> {
    return this.call(
      () => this.http.get('/catalog/home/sections', { params: { lang, perSection } }),
      (raw) => {
        const dto = homeSectionsDto.parse(raw)
        return {
          sections: dto.sections.map((section) => ({
            code: section.code,
            title: section.title,
            items: section.items.map(toProductSummary),
          })),
          hotCategories: dto.hotCategories.map(toCategory),
          totalProducts: dto.totalProducts,
        }
      },
    )
  }

  async categoriesTree(lang: string): Promise<Result<Category[], AppError>> {
    return this.call(
      () => this.http.get('/catalog/categories/tree', { params: { lang } }),
      (raw) => categoryTreeDto.parse(raw).map(toCategory),
    )
  }
}
