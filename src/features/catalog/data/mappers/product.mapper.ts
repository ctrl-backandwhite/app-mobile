import { num, text } from '@core/data/nullable'
import { Page } from '@features/catalog/domain/entities/page'
import { ProductSummary } from '@features/catalog/domain/entities/product'

import { ProductPageDto, ProductSummaryDto } from '../dto/catalog.dto'

/**
 * Traduce el producto del backend a la entidad del dominio. Solo se copian los campos que la
 * aplicación pinta: los importes numéricos que la API también expone se quedan fuera a propósito,
 * porque el precio que se muestra es siempre el ya formateado por el backend.
 */
export function toProductSummary(dto: ProductSummaryDto): ProductSummary {
  return {
    id: dto.id,
    slug: dto.slug,
    title: dto.title,
    mainImage: text(dto.mainImage),
    rating: num(dto.rating),
    monthlySales: dto.monthlySales,
    trendScore: num(dto.trendScore),
    status: dto.status,
    displayFormatted: text(dto.displayFormatted),
    originalFormatted: text(dto.originalFormatted),
    discountPercent: num(dto.discountPercent),
    promotionName: text(dto.promotionName),
  }
}

export function toProductPage(dto: ProductPageDto): Page<ProductSummary> {
  return {
    items: dto.items.map(toProductSummary),
    page: dto.page,
    size: dto.size,
    totalElements: dto.totalElements,
    totalPages: dto.totalPages,
  }
}
