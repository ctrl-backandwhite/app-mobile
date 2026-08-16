import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Category } from '../entities/category'
import { CatalogRepository } from '../ports/catalog-repository'

/**
 * Poda las ramas sin producto. Una categoría vacía en el filtro solo lleva a un listado vacío, así
 * que sobrevive únicamente si tiene producto propio o algún descendiente que sí lo tenga. Cuando el
 * backend no informa del recuento se conserva la categoría: no saber cuántos productos hay no es lo
 * mismo que saber que no hay ninguno, y esconderla dejaría el filtro incompleto.
 */
function prune(categories: readonly Category[]): Category[] {
  const kept: Category[] = []
  for (const category of categories) {
    const children = prune(category.children ?? [])
    if (category.directProductCount === 0 && children.length === 0) continue
    kept.push({ ...category, children: children.length > 0 ? children : undefined })
  }
  return kept
}

export class ListCategories {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(lang = 'es'): Promise<Result<Category[], AppError>> {
    const result = await this.repository.categoriesTree(lang)
    if (!result.ok) return result
    return ok(prune(result.value))
  }
}
