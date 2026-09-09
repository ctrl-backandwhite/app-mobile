import { homeSectionTitle } from '../entities/home'

/**
 * El backend manda el título de la sección SIEMPRE en inglés, así que la portada —la primera
 * pantalla que se ve— salía medio en otro idioma.
 */
describe('homeSectionTitle', () => {
  it('titula en español las secciones conocidas, por su código', () => {
    expect(homeSectionTitle({ code: 'trending', title: 'Trending Now', items: [] })).toBe(
      'Tendencia ahora',
    )
    expect(homeSectionTitle({ code: 'newest', title: 'New Arrivals', items: [] })).toBe(
      'Recién llegados',
    )
  })

  /** Lo que permite publicar una sección nueva sin esperar a una versión de la aplicación. */
  it('una sección desconocida se queda con el título del servidor', () => {
    expect(homeSectionTitle({ code: 'rebajas_de_enero', title: 'January Sale', items: [] })).toBe(
      'January Sale',
    )
  })
})
