import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { aCategory, aProduct } from '@features/catalog/domain/testing/fake-catalog-repository'

import { StorefrontScreen } from '../screens/StorefrontScreen'
import { renderCatalog } from '../testing/render-catalog'

function loadHomeThatReturns(...results: unknown[]) {
  const execute = jest.fn()
  for (const result of results) execute.mockResolvedValueOnce(result)
  return { execute }
}

const HOME = {
  sections: [
    { code: 'trending', title: 'Tendencia ahora', items: [aProduct({ title: 'Camisa de lino' })] },
    { code: 'newest', title: 'Recién llegados', items: [aProduct({ id: 'p-2', title: 'Botas' })] },
  ],
  hotCategories: [aCategory({ name: 'Moda mujer' })],
  totalProducts: 5174,
}

describe('StorefrontScreen', () => {
  it('pinta las secciones que compone el backend', async () => {
    await renderCatalog(<StorefrontScreen />, { loadHome: loadHomeThatReturns(ok(HOME)) as never })

    expect(await screen.findByText('Tendencia ahora')).toBeTruthy()
    expect(screen.getByText('Recién llegados')).toBeTruthy()
    expect(screen.getByText('Camisa de lino')).toBeTruthy()
  })

  it('pinta una sección cuyo código la app no conoce', async () => {
    // El título llega traducido del servidor, así que una sección nueva se muestra sin publicar
    // versión de la app. Si esto se rompe, la portada se vacía en cuanto el backend añada una.
    const home = {
      ...HOME,
      sections: [{ code: 'inventada_en_el_servidor', title: 'Novedad', items: [aProduct()] }],
    }
    await renderCatalog(<StorefrontScreen />, { loadHome: loadHomeThatReturns(ok(home)) as never })

    expect(await screen.findByText('Novedad')).toBeTruthy()
  })

  it('muestra el recuento de productos disponibles', async () => {
    await renderCatalog(<StorefrontScreen />, { loadHome: loadHomeThatReturns(ok(HOME)) as never })

    expect(await screen.findByText(/productos listos para revender/)).toBeTruthy()
  })

  it('avisa cuando todavía no hay secciones', async () => {
    const vacio = { sections: [], hotCategories: [], totalProducts: 0 }
    await renderCatalog(<StorefrontScreen />, { loadHome: loadHomeThatReturns(ok(vacio)) as never })

    expect(await screen.findByText('Aún no hay nada que mostrar')).toBeTruthy()
  })

  it('ofrece reintentar cuando la carga falla', async () => {
    const loadHome = loadHomeThatReturns(
      err(new AppError('NETWORK', 'sin conexión')),
      ok(HOME),
    )
    await renderCatalog(<StorefrontScreen />, { loadHome: loadHome as never })

    expect(await screen.findByText('No se ha podido cargar el catálogo')).toBeTruthy()
    await fireEvent.press(screen.getByText('Reintentar'))

    await waitFor(() => expect(screen.getByText('Tendencia ahora')).toBeTruthy())
  })

  it('lleva al listado filtrado al pulsar una categoría destacada', async () => {
    await renderCatalog(<StorefrontScreen />, { loadHome: loadHomeThatReturns(ok(HOME)) as never })

    await fireEvent.press(await screen.findByText('Moda mujer'))

    expect(global.routerMock.push).toHaveBeenCalledWith(
      expect.stringContaining('categoryId='),
    )
  })
})
