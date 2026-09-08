import { screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { aPage, aProduct } from '@features/catalog/domain/testing/fake-catalog-repository'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'

import { FavoritesScreen } from '../screens/FavoritesScreen'

/**
 * La pantalla de guardados.
 *
 * <p>Existe porque el corazón estaba a medias: se podía marcar un producto desde la tarjeta y desde la
 * ficha, pero no había dónde ver lo marcado. En una tienda, guardar algo que luego no se encuentra no
 * es guardar.
 */
describe('FavoritesScreen', () => {
  it('pinta los productos guardados', async () => {
    const listFavorites = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct({ title: 'Botas Martin' })]))),
    }

    await renderCatalog(<FavoritesScreen />, { listFavorites: listFavorites as never })

    expect(await screen.findByText('Botas Martin')).toBeTruthy()
  })

  /**
   * Se pide la lista COMPLETA, no los identificadores para luego pedir una ficha por cada uno: eso
   * serían N llamadas para pintar una pantalla.
   */
  it('los pide en UNA sola lectura', async () => {
    const listFavorites = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct(), aProduct({ id: 'p-2' })]))),
    }

    await renderCatalog(<FavoritesScreen />, { listFavorites: listFavorites as never })
    await waitFor(() => expect(listFavorites.execute).toHaveBeenCalledTimes(1))

    expect(listFavorites.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, lang: 'es' }),
    )
  })

  /** Una lista vacía no es un error: hay que decir qué hacer, no dejar la pantalla en blanco. */
  it('sin nada guardado invita a ir al catálogo', async () => {
    const listFavorites = { execute: jest.fn().mockResolvedValue(ok(aPage([]))) }

    await renderCatalog(<FavoritesScreen />, { listFavorites: listFavorites as never })

    expect(await screen.findByText('Todavía no has guardado nada')).toBeTruthy()
    expect(screen.getByText('Ver el catálogo')).toBeTruthy()
  })

  /** Y un fallo de red se distingue de una lista vacía: uno se reintenta, la otra no. */
  it('un fallo ofrece reintentar, no dice que no haya nada', async () => {
    const listFavorites = {
      execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
    }

    await renderCatalog(<FavoritesScreen />, { listFavorites: listFavorites as never })

    expect(await screen.findByText('No se han podido cargar tus guardados')).toBeTruthy()
    expect(screen.getByText('Reintentar')).toBeTruthy()
  })
})
