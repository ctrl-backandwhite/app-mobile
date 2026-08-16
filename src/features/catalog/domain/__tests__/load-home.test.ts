import { AppError } from '@core/errors/app-error'

import { Home } from '../entities/home'
import { aCategory, aProduct, FakeCatalogRepository } from '../testing/fake-catalog-repository'
import { LoadHome } from '../usecases/load-home'

function aHome(overrides: Partial<Home> = {}): Home {
  return {
    sections: [
      { code: 'trending', title: 'Tendencias', items: [aProduct()] },
      { code: 'video', title: 'Con vídeo', items: [] },
      { code: 'newest', title: 'Novedades', items: [aProduct({ id: 'p-2' })] },
    ],
    hotCategories: [aCategory()],
    totalProducts: 1875,
    ...overrides,
  }
}

describe('LoadHome', () => {
  it('descarta las secciones sin productos y conserva el resto', async () => {
    const repository = new FakeCatalogRepository({ home: aHome() })
    const loadHome = new LoadHome(repository)

    const result = await loadHome.execute()

    expect(result.ok && result.value.sections.map((section) => section.code)).toEqual([
      'trending',
      'newest',
    ])
    expect(result.ok && result.value.hotCategories).toHaveLength(1)
    expect(result.ok && result.value.totalProducts).toBe(1875)
  })

  it('pide ocho artículos por sección y el idioma por defecto', async () => {
    const repository = new FakeCatalogRepository({ home: aHome() })
    const loadHome = new LoadHome(repository)

    await loadHome.execute()

    expect(repository.lastPerSection).toBe(8)
    expect(repository.lastLang).toBe('es')
  })

  it('respeta el idioma y el tamaño de sección que se le piden', async () => {
    const repository = new FakeCatalogRepository({ home: aHome() })
    const loadHome = new LoadHome(repository)

    await loadHome.execute('fr', 4)

    expect(repository.lastLang).toBe('fr')
    expect(repository.lastPerSection).toBe(4)
  })

  it('devuelve una portada sin secciones cuando ninguna trae productos', async () => {
    const repository = new FakeCatalogRepository({
      home: aHome({ sections: [{ code: 'video', title: 'Con vídeo', items: [] }] }),
    })
    const loadHome = new LoadHome(repository)

    const result = await loadHome.execute()

    expect(result.ok && result.value.sections).toEqual([])
  })

  it('propaga el fallo del repositorio', async () => {
    const repository = new FakeCatalogRepository({ error: new AppError('SERVER', 'vaya') })
    const loadHome = new LoadHome(repository)

    const result = await loadHome.execute()

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('SERVER')
  })
})
