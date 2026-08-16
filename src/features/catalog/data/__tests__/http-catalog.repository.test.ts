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
})
