import {
  PriceTier,
  ProductCompliance,
  ProductDetail,
  ProductImage,
  ProductVariant,
  VariantOption,
} from '@features/catalog/domain/entities/product-detail'

import {
  ProductDetailDto,
  ProductImageDto,
  ProductVariantDto,
  VariantOptionDto,
} from '../dto/catalog.dto'
import { toProductSummary } from './product.mapper'

/** El texto del proveedor (en chino) es la reserva cuando el idioma pedido aún no está traducido. */
function translated(value?: string, fallback?: string): string {
  return value?.trim() || fallback?.trim() || ''
}

function toImage(dto: ProductImageDto): ProductImage {
  return {
    id: dto.id,
    // La copia espejada es la que se pinta; la original solo queda como reserva y para emparejar.
    url: dto.cdnUrl ?? dto.sourceUrl,
    sourceUrl: dto.sourceUrl,
    position: dto.position,
    role: dto.role,
  }
}

/** Los importes se copian tal cual: cada variante trae los suyos y no se mezclan con los del producto. */
function toVariant(dto: ProductVariantDto): ProductVariant {
  return {
    id: dto.id,
    sku: dto.sku,
    title: dto.title,
    priceFormatted: dto.priceFormatted,
    originalFormatted: dto.originalFormatted,
    discountPercent: dto.discountPercent,
    stock: dto.stock,
    imageUrl: dto.imageUrl,
    options: dto.options,
    active: dto.active,
    weightGrams: dto.weightGrams,
    lengthMm: dto.lengthMm,
    widthMm: dto.widthMm,
    heightMm: dto.heightMm,
  }
}

function toVariantOption(dto: VariantOptionDto): VariantOption {
  return {
    id: dto.id,
    name: translated(dto.name, dto.nameZh),
    position: dto.position,
    values: dto.values.map((value) => ({
      id: value.id,
      value: translated(value.value, value.valueZh),
      imageUrl: value.imageUrl,
      imageSourceUrl: value.imageSourceUrl,
      position: value.position,
    })),
  }
}

export function toProductDetail(dto: ProductDetailDto): ProductDetail {
  const compliance: ProductCompliance | undefined = dto.compliance && {
    manufacturerName: dto.compliance.manufacturerName,
    manufacturerAddress: dto.compliance.manufacturerAddress,
    manufacturerEmail: dto.compliance.manufacturerEmail,
    manufacturerComplete: dto.compliance.manufacturerComplete,
    safetyWarnings: dto.compliance.safetyWarnings,
    responsiblePerson: dto.compliance.responsiblePerson,
  }
  const priceTiers: PriceTier[] = dto.priceTiers.map((tier) => ({
    minQty: tier.minQty,
    maxQty: tier.maxQty,
    unitPriceFormatted: tier.unitPriceFormatted,
  }))
  return {
    ...toProductSummary(dto),
    description: dto.description,
    brand: dto.brand,
    moq: dto.moq,
    reviewCount: dto.reviewCount,
    videoUrl: dto.videoUrl,
    hasVideo: dto.hasVideo,
    images: dto.images.map(toImage),
    variants: dto.variants.map(toVariant),
    variantOptions: dto.variantOptions.map(toVariantOption),
    priceTiers,
    specifications: dto.specifications,
    attributes: dto.attributes,
    tags: dto.tags,
    compliance,
  }
}
