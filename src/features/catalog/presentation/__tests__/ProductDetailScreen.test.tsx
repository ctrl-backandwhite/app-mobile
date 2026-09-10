import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import {
  aProductDetail,
  aVariant,
  aVariantOption,
  aPage,
  aProduct,
} from '@features/catalog/domain/testing/fake-catalog-repository'
import { useFavoritesStore } from '@features/favorites/presentation/state/favorites.store'

import { ProductDetailScreen } from '../screens/ProductDetailScreen'
import { renderCatalog } from '../testing/render-catalog'

function container(overrides: Record<string, unknown> = {}) {
  return {
    getProductDetail: { execute: jest.fn().mockResolvedValue(ok(aProductDetail())) },
    listReviews: { execute: jest.fn().mockResolvedValue(ok(aPage([]))) },
    listRelatedProducts: { execute: jest.fn().mockResolvedValue(ok([])) },
    toggleFavorite: { execute: jest.fn().mockResolvedValue(ok(true)) },
    // La ficha lee la cesta para poner al día el distintivo de la pestaña al añadir.
    loadCart: { execute: jest.fn().mockResolvedValue([]) },
    ...overrides,
  }
}

describe('ProductDetailScreen', () => {
  beforeEach(() => {
    global.setLocalSearchParams({ slug: 'camisa-lino' })
    useFavoritesStore.getState().clear()
  })

  it('pide la ficha por el identificador de la ruta', async () => {
    const deps = container()
    await renderCatalog(<ProductDetailScreen />, deps as never)

    await waitFor(() => expect(deps.getProductDetail.execute).toHaveBeenCalledWith('camisa-lino', 'es'))
  })

  it('pinta el título y el precio del producto', async () => {
    const detail = aProductDetail({ title: 'Camisa de lino', displayFormatted: '12,90 €' })
    await renderCatalog(
      <ProductDetailScreen />,
      container({ getProductDetail: { execute: jest.fn().mockResolvedValue(ok(detail)) } }) as never,
    )

    expect(await screen.findByText('Camisa de lino')).toBeTruthy()
    // Dos veces: en el bloque de precio y en la barra de compra fija, que acompaña mientras se baja
    // por la ficha —galería, variantes, tramos, opiniones— y donde el precio tiene que seguir a la
    // vista junto al botón.
    expect(screen.getAllByText('12,90 €')).toHaveLength(2)
  })

  it('muestra el precio de la variante elegida, no el del producto', async () => {
    // Cada variante parte de un precio propio: mezclarlos llegó a pintar un tachado menor que el
    // precio rebajado.
    const detail = aProductDetail({
      displayFormatted: '12,90 €',
      variantOptions: [aVariantOption({ name: 'Color', values: [{ id: 'v1', value: 'Azul', position: 0 }] })],
      variants: [aVariant({ options: { Color: 'Azul' }, priceFormatted: '15,50 €' })],
    })
    await renderCatalog(
      <ProductDetailScreen />,
      container({ getProductDetail: { execute: jest.fn().mockResolvedValue(ok(detail)) } }) as never,
    )

    await fireEvent.press(await screen.findByText('Azul'))

    await waitFor(() => expect(screen.getAllByText('15,50 €')).toHaveLength(2))
    expect(screen.queryByText('12,90 €')).toBeNull()
  })

  it('exige elegir todas las opciones antes de continuar', async () => {
    const detail = aProductDetail({
      variantOptions: [
        aVariantOption({ name: 'Color', values: [{ id: 'v1', value: 'Azul', position: 0 }] }),
        aVariantOption({ id: 'o2', name: 'Talla', values: [{ id: 'v2', value: 'M', position: 0 }] }),
      ],
      variants: [aVariant({ options: { Color: 'Azul', Talla: 'M' } })],
    })
    await renderCatalog(
      <ProductDetailScreen />,
      container({ getProductDetail: { execute: jest.fn().mockResolvedValue(ok(detail)) } }) as never,
    )

    expect(await screen.findByText('Elige todas las opciones para continuar.')).toBeTruthy()

    await fireEvent.press(screen.getByText('Azul'))
    await fireEvent.press(screen.getByText('M'))

    await waitFor(() =>
      expect(screen.queryByText('Elige todas las opciones para continuar.')).toBeNull(),
    )
  })

  it('avisa del pedido mínimo cuando lo hay', async () => {
    const detail = aProductDetail({ moq: 5 })
    await renderCatalog(
      <ProductDetailScreen />,
      container({ getProductDetail: { execute: jest.fn().mockResolvedValue(ok(detail)) } }) as never,
    )

    expect(await screen.findByText(/Pedido mínimo: 5/)).toBeTruthy()
  })

  it('ofrece volver cuando el producto no se puede cargar', async () => {
    await renderCatalog(
      <ProductDetailScreen />,
      container({
        getProductDetail: { execute: jest.fn().mockResolvedValue(err(new AppError('NOT_FOUND', 'no está'))) },
      }) as never,
    )

    expect(await screen.findByText('No se ha podido cargar el producto')).toBeTruthy()
    await fireEvent.press(screen.getByText('Volver'))
    expect(global.routerMock.back).toHaveBeenCalled()
  })

  it('lleva a otra ficha desde los productos relacionados', async () => {
    await renderCatalog(
      <ProductDetailScreen />,
      container({
        listRelatedProducts: {
          execute: jest.fn().mockResolvedValue(ok([aProduct({ slug: 'botas-cuero', title: 'Botas' })])),
        },
      }) as never,
    )

    await fireEvent.press(await screen.findByText('Botas'))

    expect(global.routerMock.push).toHaveBeenCalledWith('/product/botas-cuero')
  })
})
