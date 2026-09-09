import { Category } from './category'
import { ProductSummary } from './product'

/**
 * Bloques que compone el backend para la portada.
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

/**
 * Cómo se titula cada sección en la portada.
 *
 * <p>El backend manda el título SIEMPRE en inglés —«Trending Now», «New Arrivals»—, así que la
 * portada, que es la primera pantalla que se ve, salía medio en otro idioma. El escaparate web
 * resuelve lo mismo por el código de la sección y no por el texto que llega; esto hace igual.
 *
 * <p>Una sección con un código que la aplicación no conoce se pinta con el título del servidor: es
 * lo que permite publicar una sección nueva sin esperar a una versión de la app, que es justo el
 * motivo de que `code` sea texto libre.
 */
const TITULOS: Readonly<Record<KnownHomeSectionCode, string>> = {
  trending: 'Tendencia ahora',
  newest: 'Recién llegados',
  video: 'Con vídeo',
  top_selling: 'Los más vendidos',
}

export function homeSectionTitle(section: HomeSection): string {
  return TITULOS[section.code as KnownHomeSectionCode] ?? section.title
}
