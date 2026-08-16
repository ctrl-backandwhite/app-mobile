import { AppError } from '@core/errors/app-error'

import { ListFavoriteIds } from '../usecases/list-favorite-ids'
import { ToggleFavorite } from '../usecases/toggle-favorite'
import { FakeFavoritesRepository } from '../testing/fake-favorites-repository'

describe('ToggleFavorite', () => {
  it('marca un producto que no lo estaba', async () => {
    const repository = new FakeFavoritesRepository()

    const result = await new ToggleFavorite(repository).execute('p-1', false)

    expect(result).toEqual({ ok: true, value: true })
    expect(repository.added).toEqual(['p-1'])
    expect(repository.removed).toEqual([])
  })

  it('desmarca un producto que ya lo estaba', async () => {
    const repository = new FakeFavoritesRepository()

    const result = await new ToggleFavorite(repository).execute('p-1', true)

    expect(result).toEqual({ ok: true, value: false })
    expect(repository.removed).toEqual(['p-1'])
    expect(repository.added).toEqual([])
  })

  it('propaga el fallo sin afirmar un cambio que no ocurrió', async () => {
    const repository = new FakeFavoritesRepository({ error: new AppError('NETWORK', 'sin conexión') })

    const result = await new ToggleFavorite(repository).execute('p-1', false)

    expect(result.ok).toBe(false)
  })
})

describe('ListFavoriteIds', () => {
  it('devuelve los identificadores marcados', async () => {
    const repository = new FakeFavoritesRepository({ ids: ['p-1', 'p-2'] })

    const result = await new ListFavoriteIds(repository).execute()

    expect(result).toEqual({ ok: true, value: ['p-1', 'p-2'] })
  })

  it('propaga el fallo', async () => {
    const repository = new FakeFavoritesRepository({ error: new AppError('SERVER', 'roto') })

    expect((await new ListFavoriteIds(repository).execute()).ok).toBe(false)
  })
})
