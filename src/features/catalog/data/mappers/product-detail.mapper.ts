import { num, text } from '@core/data/nullable'
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
/**
 * El primer texto con contenido, por orden de preferencia.
 *
 * <p>El rótulo que se elige es a la vez la CLAVE con la que la elección casa contra
 * `variante.options`, que el backend sirve YA TRADUCIDO. Quedarse con el chino no solo se lee mal:
 * deja de encontrar la variante, y entonces se puede añadir a la cesta un color que no existe.
 */
function translated(...candidates: readonly (string | undefined)[]): string {
  return candidates.find((candidate) => candidate?.trim())?.trim() ?? ''
}

function toImage(dto: ProductImageDto): ProductImage {
  return {
    id: dto.id,
    // La copia espejada es la que se pinta; la original solo queda como reserva y para emparejar.
    url: dto.cdnUrl ?? dto.sourceUrl,
    sourceUrl: dto.sourceUrl,
    position: dto.position,
    role: text(dto.role),
  }
}

/** Los importes se copian tal cual: cada variante trae los suyos y no se mezclan con los del producto. */
function toVariant(dto: ProductVariantDto): ProductVariant {
  return {
    id: dto.id,
    sku: text(dto.sku),
    title: text(dto.title),
    priceFormatted: text(dto.priceFormatted),
    originalFormatted: text(dto.originalFormatted),
    discountPercent: num(dto.discountPercent),
    stock: dto.stock,
    imageUrl: text(dto.imageUrl),
    options: dto.options,
    active: dto.active,
    weightGrams: num(dto.weightGrams),
    lengthMm: num(dto.lengthMm),
    widthMm: num(dto.widthMm),
    heightMm: num(dto.heightMm),
  }
}

function toVariantOption(dto: VariantOptionDto): VariantOption {
  return {
    id: dto.id,
    name: translated(text(dto.name), text(dto.nameZh)),
    position: dto.position,
    values: dto.values.map((value) => ({
      id: value.id,
      value: translated(text(value.valueLocalized), text(value.value), text(value.valueZh)),
      imageUrl: text(value.imageUrl),
      imageSourceUrl: text(value.imageSourceUrl),
      position: value.position,
    })),
  }
}

export function toProductDetail(dto: ProductDetailDto): ProductDetail {
  const compliance: ProductCompliance | undefined = dto.compliance
    ? {
        manufacturerName: text(dto.compliance.manufacturerName),
        manufacturerAddress: text(dto.compliance.manufacturerAddress),
        manufacturerEmail: text(dto.compliance.manufacturerEmail),
        manufacturerComplete: dto.compliance.manufacturerComplete,
        safetyWarnings: dto.compliance.safetyWarnings,
        responsiblePerson: dto.compliance.responsiblePerson
          ? {
              ...dto.compliance.responsiblePerson,
              postalCode: text(dto.compliance.responsiblePerson.postalCode),
              region: text(dto.compliance.responsiblePerson.region),
              phone: text(dto.compliance.responsiblePerson.phone),
            }
          : undefined,
      }
    : undefined
  const priceTiers: PriceTier[] = dto.priceTiers.map((tier) => ({
    minQty: tier.minQty,
    maxQty: num(tier.maxQty),
    unitPriceFormatted: text(tier.unitPriceFormatted),
  }))
  return {
    ...toProductSummary(dto),
    description: text(dto.description),
    brand: text(dto.brand),
    moq: dto.moq,
    reviewCount: dto.reviewCount,
    videoUrl: text(dto.videoUrl),
    hasVideo: dto.hasVideo ?? undefined,
    images: dto.images.map(toImage),
    variants: dto.variants.map(toVariant),
    variantOptions: dto.variantOptions.map(toVariantOption),
    priceTiers,
    specifications: dto.specifications?.map((e) => ({
      key: e.key,
      value: e.value,
      position: num(e.position),
    })),
    attributes: dto.attributes ?? undefined,
    tags: dto.tags ?? undefined,
    compliance,
  }
}
