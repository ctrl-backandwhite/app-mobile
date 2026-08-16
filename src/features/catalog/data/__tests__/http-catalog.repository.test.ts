import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'

import { HttpCatalogRepository } from '../repositories/http-catalog.repository'

function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'USD',
  })
  return { client, mock: new MockAdapter(client.raw) }
}

const PRODUCT = {
  id: 'p-1',
  slug: 'camiseta-basica',
  title: 'Camiseta básica',
  mainImage: 'https://cdn.nx036.com/p-1.jpg',
  rating: 4.6,
  monthlySales: 120,
  trendScore: 88,
  status: 'ACTIVE',
  displayFormatted: '12,90 €',
  originalFormatted: '19,90 €',
  discountPercent: 35,
  promotionName: 'Rebajas',
}

const PAGE_OK = { items: [PRODUCT], page: 0, size: 24, totalElements: 1, totalPages: 1 }

const DETAIL_OK = {
  ...PRODUCT,
  source: '1688',
  externalId: '123456',
  titleZh: '基础T恤',
  description: 'Camiseta de algodón peinado.',
  brand: 'NX036',
  moq: 2,
  reviewCount: 14,
  videoUrl: 'https://cdn.nx036.com/media/vv/demo.mp4',
  hasVideo: true,
  images: [
    {
      id: 'i-1',
      sourceUrl: 'https://cbu01.alicdn.com/img/ibank/O1CN01AAA.jpg',
      cdnUrl: 'https://cdn.nx036.com/media/aa/1.jpg',
      position: 0,
      role: 'MAIN',
    },
  ],
  variants: [
    {
      id: 'v-1',
      sku: 'SKU-1',
      title: 'Rojo / M',
      price: 14.9,
      priceFormatted: '14,90 €',
      originalFormatted: '21,90 €',
      discountPercent: 32,
      stock: 30,
      imageUrl: 'https://cdn.nx036.com/media/cc/rojo.jpg',
      options: { Color: 'Rojo', Talla: 'M' },
      active: true,
      weightGrams: 320,
      lengthMm: 300,
      widthMm: 200,
      heightMm: 40,
    },
  ],
  variantOptions: [
    {
      id: 'o-1',
      nameZh: '颜色',
      name: 'Color',
      position: 0,
      values: [
        {
          id: 'ov-1',
          valueZh: '红色',
          value: 'Rojo',
          imageUrl: 'https://cdn.nx036.com/media/cc/rojo.jpg',
          imageSourceUrl: 'https://cbu01.alicdn.com/img/ibank/O1CN01ROJO.cib.jpg',
          position: 0,
        },
      ],
    },
  ],
  priceTiers: [
    { minQty: 1, maxQty: 9, unitPrice: 12.9, currency: 'EUR', unitPriceFormatted: '12,90 €' },
    { minQty: 10, unitPrice: 11.2, currency: 'EUR', unitPriceFormatted: '11,20 €' },
  ],
  specifications: [{ key: 'Material', value: 'Algodón', position: 0 }],
  attributes: { material: 'Algodón' },
  tags: ['verano'],
  compliance: {
    manufacturerName: 'Fábrica Textil S.L.',
    manufacturerAddress: 'Calle Mayor 1, Madrid',
    manufacturerEmail: 'info@fabrica.example',
    manufacturerComplete: true,
    safetyWarnings: ['No apto para menores de 3 años'],
    responsiblePerson: {
      name: 'NX036 Europe',
      addressLine: 'Gran Vía 2',
      postalCode: '28013',
      city: 'Madrid',
      region: 'Madrid',
      country: 'ES',
      email: 'eu@nx036.example',
      phone: '+34910000000',
      role: 'IMPORTER',
      roleLabel: 'Importador',
      enabled: true,
      complete: true,
    },
  },
}

describe('HttpCatalogRepository', () => {
  it('devuelve el listado ya mapeado al dominio', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products').reply(200, PAGE_OK)
    const repository = new HttpCatalogRepository(client)

    const result = await repository.listProducts(0, 24, 'es', {})

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.totalElements).toBe(1)
    expect(result.ok && result.value.items[0]?.title).toBe('Camiseta básica')
    expect(result.ok && result.value.items[0]?.displayFormatted).toBe('12,90 €')
    expect(result.ok && result.value.items[0]?.discountPercent).toBe(35)
  })

  it('envía la paginación y los filtros como parámetros de consulta', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/catalog/products').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, PAGE_OK]
    })
    const repository = new HttpCatalogRepository(client)

    await repository.listProducts(2, 48, 'en', {
      q: 'vestido',
      categoryId: 'c-9',
      minPrice: 10,
      maxPrice: 90,
      hasVideo: true,
      minRating: 4,
      sort: 'price_asc',
    })

    expect(params).toEqual({
      page: 2,
      size: 48,
      lang: 'en',
      q: 'vestido',
      categoryId: 'c-9',
      minPrice: 10,
      maxPrice: 90,
      hasVideo: true,
      minRating: 4,
      sort: 'price_asc',
    })
  })

  it('acepta una página vacía sin productos', async () => {
    const { client, mock } = makeClient()
    mock
      .onGet('/catalog/products')
      .reply(200, { items: [], page: 0, size: 24, totalElements: 0, totalPages: 0 })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.listProducts(0, 24, 'es', { q: 'no existe' })

    expect(result.ok && result.value.items).toEqual([])
    expect(result.ok && result.value.totalPages).toBe(0)
  })

  it('tolera una página sin la lista de productos y un campo desconocido', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products').reply(200, {
      page: 0,
      size: 24,
      totalElements: 0,
      totalPages: 0,
      facetasNuevas: { color: ['rojo'] },
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.listProducts(0, 24, 'es', {})

    expect(result.ok && result.value.items).toEqual([])
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products').networkError()
    const repository = new HttpCatalogRepository(client)

    const result = await repository.listProducts(0, 24, 'es', {})

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si el producto no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products').reply(200, {
      items: [{ id: 'p-1', slug: 'camiseta-basica' }],
      page: 0,
      size: 24,
      totalElements: 1,
      totalPages: 1,
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.listProducts(0, 24, 'es', {})

    expect(result.ok).toBe(false)
    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('falla con CONTRACT si la respuesta no es una página', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products').reply(200, [PRODUCT])
    const repository = new HttpCatalogRepository(client)

    const result = await repository.listProducts(0, 24, 'es', {})

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera la portada con sus secciones, categorías destacadas y total', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/catalog/home/sections').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [
        200,
        {
          sections: [
            { code: 'trending', title: 'Tendencias', items: [PRODUCT] },
            { code: 'video', title: 'Con vídeo' },
          ],
          hotCategories: [
            { id: 'c-1', slug: 'moda-mujer', name: 'Moda mujer', parentId: null, position: 0 },
          ],
          totalProducts: 1875,
        },
      ]
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.home('es', 8)

    expect(params).toEqual({ lang: 'es', perSection: 8 })
    expect(result.ok && result.value.totalProducts).toBe(1875)
    expect(result.ok && result.value.sections[0]?.items[0]?.id).toBe('p-1')
    // Una sección sin `items` llega como sección vacía, no como error de contrato.
    expect(result.ok && result.value.sections[1]?.items).toEqual([])
    expect(result.ok && result.value.hotCategories[0]?.parentId).toBeUndefined()
  })

  it('acepta una sección con un código que la app aún no conoce', async () => {
    // La portada es la pantalla principal: si el backend publica una sección nueva antes de que
    // salga una versión de la app, debe pintarse igual (el título ya viene traducido) en lugar de
    // dejar la pantalla entera vacía.
    const { client, mock } = makeClient()
    mock.onGet('/catalog/home/sections').reply(200, {
      sections: [
        { code: 'recien_inventada', title: 'Novedad del servidor', items: [PRODUCT] },
      ],
      hotCategories: [],
      totalProducts: 1,
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.home('es', 8)

    expect(result.ok).toBe(true)
    expect(result.ok && result.value.sections[0]?.code).toBe('recien_inventada')
    expect(result.ok && result.value.sections[0]?.title).toBe('Novedad del servidor')
  })

  it('traduce un 500 de la portada a SERVER', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/home/sections').reply(500, { message: 'Se ha roto' })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.home('es', 8)

    expect(!result.ok && result.error.code).toBe('SERVER')
    expect(!result.ok && result.error.message).toBe('Se ha roto')
  })

  it('recupera el árbol de categorías con sus hijas', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/catalog/categories/tree').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [
        200,
        [
          {
            id: 'c-1',
            slug: 'moda',
            name: 'Moda',
            parentId: null,
            position: 0,
            icon: 'shirt',
            directProductCount: 0,
            children: [
              {
                id: 'c-2',
                slug: 'moda-mujer',
                name: 'Moda mujer',
                parentId: 'c-1',
                position: 1,
                directProductCount: 340,
              },
            ],
          },
        ],
      ]
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.categoriesTree('fr')

    expect(params).toEqual({ lang: 'fr' })
    expect(result.ok && result.value[0]?.icon).toBe('shirt')
    expect(result.ok && result.value[0]?.children?.[0]?.directProductCount).toBe(340)
    expect(result.ok && result.value[0]?.children?.[0]?.parentId).toBe('c-1')
  })

  it('falla con CONTRACT si el árbol de categorías no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/categories/tree').reply(200, [{ id: 'c-1', name: 'Moda' }])
    const repository = new HttpCatalogRepository(client)

    const result = await repository.categoriesTree('es')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera la ficha con imágenes, variantes, ejes y tramos', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/catalog/products/camiseta-basica').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, DETAIL_OK]
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.productBySlug('camiseta-basica', 'es')

    expect(params).toEqual({ lang: 'es' })
    expect(result.ok && result.value.moq).toBe(2)
    expect(result.ok && result.value.reviewCount).toBe(14)
    // La copia espejada es la que se pinta, y la de origen se conserva para emparejar variantes.
    expect(result.ok && result.value.images[0]?.url).toBe('https://cdn.nx036.com/media/aa/1.jpg')
    expect(result.ok && result.value.images[0]?.sourceUrl).toBe(
      'https://cbu01.alicdn.com/img/ibank/O1CN01AAA.jpg',
    )
    // Cada variante trae SU precio y SU rebaja: no se toman los del producto.
    expect(result.ok && result.value.variants[0]?.priceFormatted).toBe('14,90 €')
    expect(result.ok && result.value.variants[0]?.originalFormatted).toBe('21,90 €')
    expect(result.ok && result.value.variants[0]?.discountPercent).toBe(32)
    expect(result.ok && result.value.variants[0]?.weightGrams).toBe(320)
    expect(result.ok && result.value.variantOptions[0]?.name).toBe('Color')
    expect(result.ok && result.value.variantOptions[0]?.values[0]?.value).toBe('Rojo')
    expect(result.ok && result.value.priceTiers[1]?.unitPriceFormatted).toBe('11,20 €')
    expect(result.ok && result.value.compliance?.safetyWarnings).toEqual(['No apto para menores de 3 años'])
    expect(result.ok && result.value.compliance?.responsiblePerson?.roleLabel).toBe('Importador')
    expect(result.ok && result.value.specifications?.[0]?.value).toBe('Algodón')
    expect(result.ok && result.value.attributes?.material).toBe('Algodón')
    expect(result.ok && result.value.tags).toEqual(['verano'])
  })

  it('cae al texto del proveedor cuando el eje no está traducido', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/camiseta-basica').reply(200, {
      ...DETAIL_OK,
      variantOptions: [
        {
          id: 'o-1',
          nameZh: '颜色',
          position: 0,
          values: [{ id: 'ov-1', valueZh: '红色', position: 0 }],
        },
        // Eje sin ningún texto: llega vacío, pero no tumba la ficha entera.
        { id: 'o-2', position: 1, values: [{ id: 'ov-2', position: 0 }] },
      ],
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.productBySlug('camiseta-basica', 'es')

    expect(result.ok && result.value.variantOptions[0]?.name).toBe('颜色')
    expect(result.ok && result.value.variantOptions[0]?.values[0]?.value).toBe('红色')
    expect(result.ok && result.value.variantOptions[1]?.name).toBe('')
    expect(result.ok && result.value.variantOptions[1]?.values[0]?.value).toBe('')
  })

  it('tolera una ficha sin listas ni bloques opcionales', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/camiseta-basica').reply(200, {
      ...PRODUCT,
      source: '1688',
      externalId: '999',
      titleZh: '基础T恤',
      novedadDelServidor: true,
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.productBySlug('camiseta-basica', 'es')

    expect(result.ok && result.value.images).toEqual([])
    expect(result.ok && result.value.variants).toEqual([])
    expect(result.ok && result.value.variantOptions).toEqual([])
    expect(result.ok && result.value.priceTiers).toEqual([])
    // Sin pedido mínimo se compra de uno en uno; sin recuento no hay opiniones que anunciar.
    expect(result.ok && result.value.moq).toBe(1)
    expect(result.ok && result.value.reviewCount).toBe(0)
    expect(result.ok && result.value.compliance).toBeUndefined()
  })

  it('sin copia espejada se pinta la foto del proveedor', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/camiseta-basica').reply(200, {
      ...DETAIL_OK,
      images: [
        { id: 'i-1', sourceUrl: 'https://cbu01.alicdn.com/img/ibank/O1CN01AAA.jpg', position: 0 },
      ],
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.productBySlug('camiseta-basica', 'es')

    expect(result.ok && result.value.images[0]?.url).toBe(
      'https://cbu01.alicdn.com/img/ibank/O1CN01AAA.jpg',
    )
    expect(result.ok && result.value.images[0]?.role).toBeUndefined()
  })

  it('traduce un 404 de la ficha a NOT_FOUND', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/no-existe').reply(404, { message: 'Producto no encontrado' })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.productBySlug('no-existe', 'es')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(!result.ok && result.error.message).toBe('Producto no encontrado')
  })

  it('falla con CONTRACT si la ficha no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/camiseta-basica').reply(200, { id: 'p-1', slug: 'camiseta-basica' })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.productBySlug('camiseta-basica', 'es')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera las opiniones paginadas', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/catalog/products/p-1/reviews').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [
        200,
        {
          items: [
            {
              id: 'r-1',
              rating: 5,
              title: 'Perfecta',
              body: 'Muy buena calidad.',
              authorName: 'Ana',
              createdAt: '2026-08-01T10:00:00Z',
              // El reparto por estrellas y la media también viajan y no deben estorbar.
              helpfulCount: 3,
            },
          ],
          page: 1,
          size: 20,
          totalElements: 41,
          totalPages: 3,
          distribution: { '5': 30, '4': 11 },
          averageRating: 4.7,
        },
      ]
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.reviews('p-1', 1, 20)

    expect(params).toEqual({ page: 1, size: 20 })
    expect(result.ok && result.value.totalElements).toBe(41)
    expect(result.ok && result.value.items[0]?.authorName).toBe('Ana')
    expect(result.ok && result.value.items[0]?.createdAt).toBe('2026-08-01T10:00:00Z')
  })

  it('tolera una página de opiniones sin lista', async () => {
    const { client, mock } = makeClient()
    mock
      .onGet('/catalog/products/p-1/reviews')
      .reply(200, { page: 0, size: 20, totalElements: 0, totalPages: 0 })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.reviews('p-1', 0, 20)

    expect(result.ok && result.value.items).toEqual([])
  })

  it('traduce un 404 de las opiniones a NOT_FOUND', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/p-9/reviews').reply(404, {})
    const repository = new HttpCatalogRepository(client)

    const result = await repository.reviews('p-9', 0, 20)

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
  })

  it('falla con CONTRACT si las opiniones no cumplen el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/p-1/reviews').reply(200, { items: [{ id: 'r-1' }], page: 0 })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.reviews('p-1', 0, 20)

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('recupera los productos relacionados', async () => {
    const { client, mock } = makeClient()
    let params: Record<string, unknown> = {}
    mock.onGet('/catalog/products/p-1/related').reply((config) => {
      params = (config.params ?? {}) as Record<string, unknown>
      return [200, [PRODUCT]]
    })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.relatedProducts('p-1', 'it', 8)

    expect(params).toEqual({ lang: 'it', limit: 8 })
    expect(result.ok && result.value[0]?.displayFormatted).toBe('12,90 €')
  })

  it('traduce un 404 de los relacionados a NOT_FOUND', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/p-9/related').reply(404, {})
    const repository = new HttpCatalogRepository(client)

    const result = await repository.relatedProducts('p-9', 'es', 8)

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
  })

  it('falla con CONTRACT si los relacionados no son una lista', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/catalog/products/p-1/related').reply(200, { items: [PRODUCT] })
    const repository = new HttpCatalogRepository(client)

    const result = await repository.relatedProducts('p-1', 'es', 8)

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
