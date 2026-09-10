import { AppError } from '@core/errors/app-error'
import { aPage, aProduct } from '@features/catalog/domain/testing/fake-catalog-repository'

import { FakeHistoryRepository } from '../testing/fake-history-repository'
import { ListViewedProducts } from '../usecases/list-viewed-products'

describe('ListViewedProducts', () => {
  it('devuelve la página de productos vistos', async () => {
    const repository = new FakeHistoryRepository({ page: aPage([aProduct({ title: 'Botas' })]) })

    const result = await new ListViewedProducts(repository).execute({ page: 0, size: 20, lang: 'es' })

    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.items[0]?.title).toBe('Botas')
  })

  it('propaga el error del servidor sin inventarse una lista vacía', async () => {
    // Una lista vacía y un fallo se pintan distinto: confundirlos diría «no has visto nada» a quien
    // solo se ha quedado sin cobertura.
    const repository = new FakeHistoryRepository({ error: new AppError('NETWORK', 'sin red') })

    const result = await new ListViewedProducts(repository).execute({ page: 0, size: 20, lang: 'es' })

    expect(result.ok).toBe(false)
  })
})
