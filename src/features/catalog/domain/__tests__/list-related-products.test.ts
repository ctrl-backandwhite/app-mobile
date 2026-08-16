import { AppError } from '@core/errors/app-error'

import { aProduct, FakeCatalogRepository } from '../testing/fake-catalog-repository'
import { ListRelatedProducts } from '../usecases/list-related-products'

describe('ListRelatedProducts', () => {
  it('devuelve los relacionados con el límite por defecto', async () => {
    const repository = new FakeCatalogRepository({ related: [aProduct({ id: 'p-2' })] })

    const result = await new ListRelatedProducts(repository).execute('p-1')

    expect(result.ok && result.value).toHaveLength(1)
    expect(repository.lastProductId).toBe('p-1')
    expect(repository.lastLang).toBe('es')
    expect(repository.lastLimit).toBe(8)
  })

  it('acota un límite desmedido', async () => {
    const repository = new FakeCatalogRepository({ related: [] })

    await new ListRelatedProducts(repository).execute('p-1', 'de', 999)

    expect(repository.lastLang).toBe('de')
    expect(repository.lastLimit).toBe(24)
  })

  it('un límite de cero se sube al mínimo', async () => {
    const repository = new FakeCatalogRepository({ related: [] })

    await new ListRelatedProducts(repository).execute('p-1', 'es', 0)

    expect(repository.lastLimit).toBe(1)
  })

  it('excluye el producto que se está mirando', async () => {
    const repository = new FakeCatalogRepository({
      related: [aProduct({ id: 'p-1' }), aProduct({ id: 'p-2' })],
    })

    const result = await new ListRelatedProducts(repository).execute('p-1')

    expect(result.ok && result.value.map((product) => product.id)).toEqual(['p-2'])
  })

  it('propaga el error del repositorio', async () => {
    const repository = new FakeCatalogRepository({ error: new AppError('NETWORK', 'Sin conexión') })

    const result = await new ListRelatedProducts(repository).execute('p-1')

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
