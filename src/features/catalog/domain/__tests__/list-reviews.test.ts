import { AppError } from '@core/errors/app-error'

import { Page } from '../entities/page'
import { Review } from '../entities/review'
import { aReview, FakeCatalogRepository } from '../testing/fake-catalog-repository'
import { ListReviews } from '../usecases/list-reviews'

function aReviewPage(items: Review[] = [aReview()]): Page<Review> {
  return { items, page: 0, size: 20, totalElements: items.length, totalPages: 1 }
}

describe('ListReviews', () => {
  it('devuelve las opiniones con la paginación por defecto', async () => {
    const repository = new FakeCatalogRepository({ reviews: aReviewPage() })

    const result = await new ListReviews(repository).execute({ productId: 'p-1' })

    expect(result.ok && result.value.items[0]?.rating).toBe(5)
    expect(repository.lastProductId).toBe('p-1')
    expect(repository.lastPage).toBe(0)
    expect(repository.lastSize).toBe(20)
  })

  it('acota un tamaño de página desmedido', async () => {
    const repository = new FakeCatalogRepository({ reviews: aReviewPage() })

    await new ListReviews(repository).execute({ productId: 'p-1', page: 3, size: 500 })

    expect(repository.lastPage).toBe(3)
    expect(repository.lastSize).toBe(50)
  })

  it('un tamaño de cero o negativo se sube al mínimo', async () => {
    const repository = new FakeCatalogRepository({ reviews: aReviewPage() })

    await new ListReviews(repository).execute({ productId: 'p-1', size: 0 })

    expect(repository.lastSize).toBe(1)
  })

  it('una página negativa se corrige a la primera', async () => {
    const repository = new FakeCatalogRepository({ reviews: aReviewPage() })

    await new ListReviews(repository).execute({ productId: 'p-1', page: -2 })

    expect(repository.lastPage).toBe(0)
  })

  it('propaga el error del repositorio', async () => {
    const repository = new FakeCatalogRepository({ error: new AppError('SERVER', 'Se ha roto') })

    const result = await new ListReviews(repository).execute({ productId: 'p-1' })

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})
