import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { aCategory, aPage, aProduct } from '@features/catalog/domain/testing/fake-catalog-repository'

import { CatalogScreen } from '../screens/CatalogScreen'
import { renderCatalog } from '../testing/render-catalog'

function categoriesThatReturn(result: unknown) {
  return { execute: jest.fn().mockResolvedValue(result) }
}

const CATEGORIES = ok([aCategory({ id: 'c-1', name: 'Moda mujer' })])

describe('CatalogScreen', () => {
  it('pinta los productos de la primera página', async () => {
    const browseProducts = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct({ title: 'Camisa de lino' })]))),
    }
    await renderCatalog(<CatalogScreen />, {
      browseProducts: browseProducts as never,
      listCategories: categoriesThatReturn(CATEGORIES) as never,
    })

    expect(await screen.findByText('Camisa de lino')).toBeTruthy()
  })

  it('no busca en cada pulsación, solo al enviar', async () => {
    const browseProducts = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct()]))),
    }
    await renderCatalog(<CatalogScreen />, {
      browseProducts: browseProducts as never,
      listCategories: categoriesThatReturn(CATEGORIES) as never,
    })
    await waitFor(() => expect(browseProducts.execute).toHaveBeenCalledTimes(1))

    // Escribir no debe disparar una petición por carácter: haría parpadear la lista.
    await fireEvent.changeText(screen.getByLabelText('Buscar productos'), 'camisa')
    expect(browseProducts.execute).toHaveBeenCalledTimes(1)

    await fireEvent(screen.getByLabelText('Buscar productos'), 'submitEditing')

    await waitFor(() =>
      expect(browseProducts.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ q: 'camisa' }) }),
      ),
    )
  })

  it('filtra por categoría y la quita al volver a pulsarla', async () => {
    const browseProducts = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct()]))),
    }
    await renderCatalog(<CatalogScreen />, {
      browseProducts: browseProducts as never,
      listCategories: categoriesThatReturn(CATEGORIES) as never,
    })

    await fireEvent.press(await screen.findByText('Moda mujer'))
    await waitFor(() =>
      expect(browseProducts.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ categoryId: 'c-1' }) }),
      ),
    )

    // Volver a pulsarla es la forma natural de deshacer el filtro.
    await fireEvent.press(screen.getByText('Moda mujer'))
    await waitFor(() =>
      expect(browseProducts.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ categoryId: undefined }) }),
      ),
    )
  })

  it('avisa cuando la búsqueda no devuelve nada y permite limpiarla', async () => {
    const browseProducts = { execute: jest.fn().mockResolvedValue(ok(aPage([]))) }
    await renderCatalog(<CatalogScreen />, {
      browseProducts: browseProducts as never,
      listCategories: categoriesThatReturn(CATEGORIES) as never,
    })

    await fireEvent.changeText(screen.getByLabelText('Buscar productos'), 'nohaynada')
    await fireEvent(screen.getByLabelText('Buscar productos'), 'submitEditing')

    expect(await screen.findByText('Sin resultados')).toBeTruthy()
    expect(screen.getByText(/nohaynada/)).toBeTruthy()
    await fireEvent.press(screen.getByText('Limpiar búsqueda'))

    await waitFor(() =>
      expect(browseProducts.execute).toHaveBeenLastCalledWith(
        expect.objectContaining({ filters: expect.objectContaining({ q: undefined }) }),
      ),
    )
  })

  it('ofrece reintentar cuando el listado falla', async () => {
    const browseProducts = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(err(new AppError('NETWORK', 'sin conexión')))
        .mockResolvedValue(ok(aPage([aProduct({ title: 'Camisa de lino' })]))),
    }
    await renderCatalog(<CatalogScreen />, {
      browseProducts: browseProducts as never,
      listCategories: categoriesThatReturn(CATEGORIES) as never,
    })

    expect(await screen.findByText('No se ha podido cargar el catálogo')).toBeTruthy()
    await fireEvent.press(screen.getByText('Reintentar'))

    await waitFor(() => expect(screen.getByText('Camisa de lino')).toBeTruthy())
  })

  it('avisa de que no hay más productos al llegar al final', async () => {
    const browseProducts = {
      execute: jest.fn().mockResolvedValue(ok(aPage([aProduct()], { totalPages: 1 }))),
    }
    await renderCatalog(<CatalogScreen />, {
      browseProducts: browseProducts as never,
      listCategories: categoriesThatReturn(CATEGORIES) as never,
    })

    expect(await screen.findByText('No hay más productos')).toBeTruthy()
  })
})
