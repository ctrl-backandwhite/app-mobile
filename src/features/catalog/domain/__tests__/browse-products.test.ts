import { AppError } from '@core/errors/app-error'

import { hasNextPage } from '../entities/page'
import { aPage, aProduct, FakeCatalogRepository } from '../testing/fake-catalog-repository'
import { BrowseProducts } from '../usecases/browse-products'

describe('BrowseProducts', () => {
  it('devuelve la página del catálogo con los valores por defecto', async () => {
    const page = aPage([aProduct(), aProduct({ id: 'p-2' })])
    const repository = new FakeCatalogRepository({ page })
    const browse = new BrowseProducts(repository)

    const result = await browse.execute()

    expect(result).toEqual({ ok: true, value: page })
    expect(repository.lastPage).toBe(0)
    expect(repository.lastSize).toBe(24)
    expect(repository.lastLang).toBe('es')
  })

  it('respeta la página, el idioma y los filtros que se le pasan', async () => {
    const repository = new FakeCatalogRepository({ page: aPage() })
    const browse = new BrowseProducts(repository)

    await browse.execute({
      page: 3,
      size: 12,
      lang: 'en',
      filters: { categoryId: 'c-9', sort: 'price_asc', hasVideo: true },
    })

    expect(repository.lastPage).toBe(3)
    expect(repository.lastSize).toBe(12)
    expect(repository.lastLang).toBe('en')
    expect(repository.lastFilters).toEqual({ categoryId: 'c-9', sort: 'price_asc', hasVideo: true })
  })

  it('recorta un tamaño de página desmedido al máximo admitido', async () => {
    const repository = new FakeCatalogRepository({ page: aPage() })
    const browse = new BrowseProducts(repository)

    await browse.execute({ size: 500 })

    expect(repository.lastSize).toBe(60)
  })

  it('sube a uno un tamaño de página sin sentido', async () => {
    const repository = new FakeCatalogRepository({ page: aPage() })
    const browse = new BrowseProducts(repository)

    await browse.execute({ size: 0 })

    expect(repository.lastSize).toBe(1)
  })

  it('normaliza el término de búsqueda quitando los espacios sobrantes', async () => {
    const repository = new FakeCatalogRepository({ page: aPage() })
    const browse = new BrowseProducts(repository)

    await browse.execute({ filters: { q: '  vestido rojo  ' } })

    expect(repository.lastFilters?.q).toBe('vestido rojo')
  })

  it('descarta un término de búsqueda en blanco', async () => {
    const repository = new FakeCatalogRepository({ page: aPage() })
    const browse = new BrowseProducts(repository)

    await browse.execute({ filters: { q: '   ', categoryId: 'c-1' } })

    expect(repository.lastFilters?.q).toBeUndefined()
    expect(repository.lastFilters?.categoryId).toBe('c-1')
  })

  it('devuelve una página vacía sin siguiente cuando la búsqueda no encuentra nada', async () => {
    const repository = new FakeCatalogRepository({ page: aPage([]) })
    const browse = new BrowseProducts(repository)

    const result = await browse.execute({ filters: { q: 'no existe' } })

    expect(result.ok && result.value.items).toEqual([])
    expect(result.ok && hasNextPage(result.value)).toBe(false)
  })

  it('propaga el fallo del repositorio sin traducirlo', async () => {
    const repository = new FakeCatalogRepository({ error: new AppError('NETWORK', 'sin conexión') })
    const browse = new BrowseProducts(repository)

    const result = await browse.execute()

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('NETWORK')
  })
})
