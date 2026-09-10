import { screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { aPage, aProduct } from '@features/catalog/domain/testing/fake-catalog-repository'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'

import { ViewedProductsScreen } from '../screens/ViewedProductsScreen'

/**
 * «Lo que has visto».
 *
 * <p>Es la misma lista que alimenta el correo de recordatorio cada tres días, así que lo que se
 * enseña aquí y lo que llega por correo no pueden discrepar: por eso se pide al servidor y no se
 * guarda en el teléfono.
 */
describe('ViewedProductsScreen', () => {
  it('pinta las fichas visitadas', async () => {
    const listViewedProducts = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct({ title: 'Botas Martin' })]))),
    }

    await renderCatalog(<ViewedProductsScreen />, {
      listViewedProducts: listViewedProducts as never,
    })

    expect(await screen.findByText('Botas Martin')).toBeTruthy()
  })

  it('las pide en el idioma activo y en una sola lectura', async () => {
    const listViewedProducts = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct(), aProduct({ id: 'p-2' })]))),
    }

    await renderCatalog(<ViewedProductsScreen />, {
      listViewedProducts: listViewedProducts as never,
    })
    await waitFor(() => expect(listViewedProducts.execute).toHaveBeenCalledTimes(1))

    expect(listViewedProducts.execute).toHaveBeenCalledWith(
      expect.objectContaining({ page: 0, lang: 'es' }),
    )
  })

  it('sin visitas dice qué hacer en vez de dejar la pantalla en blanco', async () => {
    const listViewedProducts = { execute: jest.fn().mockResolvedValue(ok(aPage([]))) }

    await renderCatalog(<ViewedProductsScreen />, {
      listViewedProducts: listViewedProducts as never,
    })

    expect(await screen.findByText('Todavía no has visto ningún producto')).toBeTruthy()
  })

  it('un fallo de red no se disfraza de historial vacío', async () => {
    const listViewedProducts = {
      execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin red'))),
    }

    await renderCatalog(<ViewedProductsScreen />, {
      listViewedProducts: listViewedProducts as never,
    })

    expect(await screen.findByText('No se ha podido cargar tu historial')).toBeTruthy()
  })
})
