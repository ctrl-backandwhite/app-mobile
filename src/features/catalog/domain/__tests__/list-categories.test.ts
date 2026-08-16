import { AppError } from '@core/errors/app-error'

import { aCategory, FakeCatalogRepository } from '../testing/fake-catalog-repository'
import { ListCategories } from '../usecases/list-categories'

describe('ListCategories', () => {
  it('descarta las categorías sin productos', async () => {
    const repository = new FakeCatalogRepository({
      categories: [
        aCategory({ id: 'c-1', name: 'Moda mujer', directProductCount: 12 }),
        aCategory({ id: 'c-2', name: 'Descatalogado', directProductCount: 0 }),
      ],
    })
    const listCategories = new ListCategories(repository)

    const result = await listCategories.execute()

    expect(result.ok && result.value.map((category) => category.id)).toEqual(['c-1'])
  })

  it('conserva el padre vacío cuyo hijo sí tiene productos, y poda solo el hijo vacío', async () => {
    const repository = new FakeCatalogRepository({
      categories: [
        aCategory({
          id: 'raiz',
          directProductCount: 0,
          children: [
            aCategory({ id: 'hija-llena', parentId: 'raiz', directProductCount: 30 }),
            aCategory({ id: 'hija-vacia', parentId: 'raiz', directProductCount: 0 }),
          ],
        }),
      ],
    })
    const listCategories = new ListCategories(repository)

    const result = await listCategories.execute()

    expect(result.ok && result.value).toHaveLength(1)
    expect(result.ok && result.value[0]?.children?.map((child) => child.id)).toEqual(['hija-llena'])
  })

  it('descarta la rama entera cuando ni el padre ni sus hijos tienen productos', async () => {
    const repository = new FakeCatalogRepository({
      categories: [
        aCategory({
          id: 'raiz',
          directProductCount: 0,
          children: [aCategory({ id: 'hija', parentId: 'raiz', directProductCount: 0 })],
        }),
      ],
    })
    const listCategories = new ListCategories(repository)

    const result = await listCategories.execute()

    expect(result.ok && result.value).toEqual([])
  })

  it('conserva la categoría de la que el backend no informa el recuento', async () => {
    const repository = new FakeCatalogRepository({
      categories: [aCategory({ id: 'sin-recuento', directProductCount: undefined })],
    })
    const listCategories = new ListCategories(repository)

    const result = await listCategories.execute()

    expect(result.ok && result.value.map((category) => category.id)).toEqual(['sin-recuento'])
    // Sin hijos supervivientes no se inventa una lista vacía: la hoja se queda como hoja.
    expect(result.ok && result.value[0]?.children).toBeUndefined()
  })

  it('traslada el idioma al repositorio', async () => {
    const repository = new FakeCatalogRepository({ categories: [] })
    const listCategories = new ListCategories(repository)

    await listCategories.execute('de')

    expect(repository.lastLang).toBe('de')
  })

  it('propaga el fallo del repositorio', async () => {
    const repository = new FakeCatalogRepository({ error: new AppError('NETWORK', 'sin conexión') })
    const listCategories = new ListCategories(repository)

    const result = await listCategories.execute()

    expect(result.ok).toBe(false)
    expect(result.ok === false && result.error.code).toBe('NETWORK')
  })
})
