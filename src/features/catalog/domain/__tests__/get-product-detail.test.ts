import { AppError } from '@core/errors/app-error'

import { FakeCatalogRepository, aProductDetail } from '../testing/fake-catalog-repository'
import { GetProductDetail } from '../usecases/get-product-detail'

describe('GetProductDetail', () => {
  it('devuelve la ficha y pide el idioma indicado', async () => {
    const repository = new FakeCatalogRepository({ detail: aProductDetail() })

    const result = await new GetProductDetail(repository).execute('camiseta-basica', 'fr')

    expect(result.ok && result.value.slug).toBe('camiseta-basica')
    expect(repository.lastSlug).toBe('camiseta-basica')
    expect(repository.lastLang).toBe('fr')
  })

  it('el idioma por defecto es el español', async () => {
    const repository = new FakeCatalogRepository({ detail: aProductDetail() })

    await new GetProductDetail(repository).execute('camiseta-basica')

    expect(repository.lastLang).toBe('es')
  })

  it('recorta los espacios del slug antes de pedirlo', async () => {
    const repository = new FakeCatalogRepository({ detail: aProductDetail() })

    await new GetProductDetail(repository).execute('  camiseta-basica  ')

    expect(repository.lastSlug).toBe('camiseta-basica')
  })

  it('un slug vacío falla como NOT_FOUND sin llamar al backend', async () => {
    const repository = new FakeCatalogRepository({ detail: aProductDetail() })

    const result = await new GetProductDetail(repository).execute('   ')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
    expect(repository.lastSlug).toBeNull()
  })

  it('propaga el error del repositorio', async () => {
    const repository = new FakeCatalogRepository({ error: new AppError('NOT_FOUND', 'No existe') })

    const result = await new GetProductDetail(repository).execute('no-existe')

    expect(!result.ok && result.error.code).toBe('NOT_FOUND')
  })
})
