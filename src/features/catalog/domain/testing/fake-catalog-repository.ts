/**
 * Dobles del dominio del catálogo, compartidos por las pruebas de esta feature y de las que la
 * consumen.
 *
 * Viven fuera de `__tests__` porque el `testMatch` de jest-expo trata como suite cualquier fichero
 * bajo esa carpeta, y un módulo sin `it` rompe la ejecución.
 */
import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'

import { Category } from '../entities/category'
import { ProductFilters } from '../entities/filters'
import { Home } from '../entities/home'
import { Page } from '../entities/page'
import { ProductSummary } from '../entities/product'
import { CatalogRepository } from '../ports/catalog-repository'

export function aProduct(overrides: Partial<ProductSummary> = {}): ProductSummary {
  return {
    id: 'p-1',
    slug: 'camiseta-basica',
    title: 'Camiseta básica',
    mainImage: 'https://cdn.nx036.com/p-1.jpg',
    rating: 4.6,
    monthlySales: 120,
    status: 'ACTIVE',
    displayFormatted: '12,90 €',
    ...overrides,
  }
}

export function aCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: 'c-1',
    slug: 'moda-mujer',
    name: 'Moda mujer',
    position: 0,
    directProductCount: 12,
    ...overrides,
  }
}

export function aPage(
  items: readonly ProductSummary[] = [aProduct()],
  overrides: Partial<Page<ProductSummary>> = {},
): Page<ProductSummary> {
  return {
    items,
    page: 0,
    size: 24,
    totalElements: items.length,
    totalPages: items.length > 0 ? 1 : 0,
    ...overrides,
  }
}

interface Config {
  page?: Page<ProductSummary>
  home?: Home
  categories?: Category[]
  error?: AppError
}

export class FakeCatalogRepository implements CatalogRepository {
  lastPage: number | null = null
  lastSize: number | null = null
  lastLang: string | null = null
  lastFilters: ProductFilters | null = null
  lastPerSection: number | null = null

  constructor(private readonly config: Config = {}) {}

  private fail<T>(): Result<T, AppError> {
    return err(this.config.error ?? new AppError('UNKNOWN', 'sin configurar'))
  }

  async listProducts(
    page: number,
    size: number,
    lang: string,
    filters: ProductFilters,
  ): Promise<Result<Page<ProductSummary>, AppError>> {
    this.lastPage = page
    this.lastSize = size
    this.lastLang = lang
    this.lastFilters = filters
    return this.config.page ? ok(this.config.page) : this.fail<Page<ProductSummary>>()
  }

  async home(lang: string, perSection: number): Promise<Result<Home, AppError>> {
    this.lastLang = lang
    this.lastPerSection = perSection
    return this.config.home ? ok(this.config.home) : this.fail<Home>()
  }

  async categoriesTree(lang: string): Promise<Result<Category[], AppError>> {
    this.lastLang = lang
    return this.config.categories ? ok(this.config.categories) : this.fail<Category[]>()
  }
}
