import { Category } from './category'
import { ProductSummary } from './product'

/**
 * Bloques que compone el backend para la portada. El título ya viene traducido, así que la
 * aplicación puede pintar una sección sin entender su código.
 *
 * Por eso `code` es un texto libre y no una unión cerrada: si el servidor publicara una sección
 * nueva, una unión cerrada haría fallar la validación y la portada entera —la pantalla principal—
 * se quedaría vacía hasta que saliera una versión de la app. Los códigos conocidos están aquí solo
 * para elegir icono o adorno; cualquier otro se pinta igual.
 */
export const KNOWN_HOME_SECTIONS = ['trending', 'newest', 'video', 'top_selling'] as const

export type KnownHomeSectionCode = (typeof KNOWN_HOME_SECTIONS)[number]

export interface HomeSection {
  readonly code: string
  readonly title: string
  readonly items: readonly ProductSummary[]
}

export interface Home {
  readonly sections: readonly HomeSection[]
  readonly hotCategories: readonly Category[]
  readonly totalProducts: number
}
