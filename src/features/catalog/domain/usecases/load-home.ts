import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { Home } from '../entities/home'
import { CatalogRepository } from '../ports/catalog-repository'

/** Suficiente para un carrusel horizontal sin descargar fichas que nadie llega a ver. */
const DEFAULT_PER_SECTION = 8

export class LoadHome {
  constructor(private readonly repository: CatalogRepository) {}

  async execute(lang = 'es', perSection: number = DEFAULT_PER_SECTION): Promise<Result<Home, AppError>> {
    const result = await this.repository.home(lang, perSection)
    if (!result.ok) return result
    // El backend compone siempre las cuatro secciones, aunque alguna se quede sin productos (por
    // ejemplo «con vídeo» en un catálogo recién cargado). Se descartan aquí para que la portada no
    // pinte un título con un carrusel vacío debajo.
    const sections = result.value.sections.filter((section) => section.items.length > 0)
    return ok({ ...result.value, sections })
  }
}
