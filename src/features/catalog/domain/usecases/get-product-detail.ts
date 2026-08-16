import { AppError } from '@core/errors/app-error'
import { err, Result } from '@core/result/result'

import { ProductDetail } from '../entities/product-detail'
import { CatalogRepository } from '../ports/catalog-repository'

export class GetProductDetail {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(slug: string, lang = 'es'): Promise<Result<ProductDetail, AppError>> {
    const clean = slug.trim()
    // Un slug vacío formaría la ruta del listado y devolvería una página entera de productos donde
    // se espera una ficha; se corta aquí para que el fallo sea el mismo que el de una ficha que no
    // existe.
    if (clean.length === 0) {
      return err(new AppError('NOT_FOUND', 'No se ha encontrado el producto solicitado.'))
    }
    return this.repository.productBySlug(clean, lang)
  }
}
