import {
  PriceTier,
  ProductCompliance,
  ProductImage,
  VariantOption,
} from '@features/catalog/domain/entities/product-detail'
import { Review } from '@features/catalog/domain/entities/review'

/**
 * Piezas de la ficha para las pruebas de los componentes.
 *
 * Vive en `testing/` y no en `__tests__/`: jest-expo trata cualquier fichero de `__tests__` como una
 * suite y un ayudante sin pruebas dentro fallaría con «your test suite must contain at least one test».
 */
export function anImage(overrides: Partial<ProductImage> = {}): ProductImage {
  return {
    id: 'img-1',
    url: 'https://cdn.test/1.jpg',
    position: 0,
    ...overrides,
  }
}

export function someImages(count: number): ProductImage[] {
  return Array.from({ length: count }, (_unused: unknown, position: number): ProductImage =>
    anImage({ id: `img-${position}`, url: `https://cdn.test/${position}.jpg`, position }),
  )
}

export function aColorOption(overrides: Partial<VariantOption> = {}): VariantOption {
  return {
    id: 'opt-color',
    name: 'Color',
    position: 0,
    values: [
      { id: 'v-azul', value: 'Azul', imageUrl: 'https://cdn.test/azul.jpg', position: 0 },
      { id: 'v-rojo', value: 'Rojo', imageUrl: 'https://cdn.test/rojo.jpg', position: 1 },
    ],
    ...overrides,
  }
}

export function aSizeOption(overrides: Partial<VariantOption> = {}): VariantOption {
  return {
    id: 'opt-talla',
    name: 'Talla',
    position: 1,
    values: [
      { id: 'v-m', value: 'M', position: 0 },
      { id: 'v-l', value: 'L', position: 1 },
    ],
    ...overrides,
  }
}

export function someTiers(): PriceTier[] {
  return [
    { minQty: 1, maxQty: 9, unitPriceFormatted: '24,90 €' },
    { minQty: 10, maxQty: 49, unitPriceFormatted: '21,50 €' },
    { minQty: 50, unitPriceFormatted: '18,90 €' },
  ]
}

export function aCompliance(overrides: Partial<ProductCompliance> = {}): ProductCompliance {
  return {
    manufacturerName: 'Ningbo Textil Co. Ltd',
    manufacturerAddress: 'Calle Fabril 12, Ningbo, China',
    manufacturerEmail: 'compliance@ningbo-textil.test',
    manufacturerComplete: true,
    safetyWarnings: ['No apto para menores de 3 años.', 'Manténgase alejado del fuego.'],
    responsiblePerson: {
      name: 'NX036 Europe SL',
      addressLine: 'Gran Vía 1',
      postalCode: '28013',
      city: 'Madrid',
      country: 'ES',
      email: 'ue@nx036.test',
      roleLabel: 'Importador',
    },
    ...overrides,
  }
}

export function aReview(overrides: Partial<Review> = {}): Review {
  return {
    id: 'r-1',
    rating: 5,
    title: 'Muy buena calidad',
    body: 'La tela es gruesa y el corte es el de la foto.',
    authorName: 'Marta G.',
    createdAt: '2026-08-14T09:31:00Z',
    ...overrides,
  }
}
