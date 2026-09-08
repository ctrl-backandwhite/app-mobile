import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { RegionScreen } from '../screens/RegionScreen'

const IDIOMAS = ok([
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
])
const DIVISAS = ok([
  { code: 'USD', name: 'Dólar', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' },
])

function contenedor(savePreferences = { execute: jest.fn().mockResolvedValue(undefined) }) {
  return {
    listLanguages: { execute: jest.fn().mockResolvedValue(IDIOMAS) } as never,
    listCurrencies: { execute: jest.fn().mockResolvedValue(DIVISAS) } as never,
    savePreferences: savePreferences as never,
  }
}

/**
 * Idioma y divisa NO son una preferencia decorativa: las dos viajan en cada petición al servidor
 * (`X-Currency`, `Accept-Language`), así que de la divisa salen los importes que se leen antes de
 * comprar y del idioma sale el texto del catálogo.
 */
describe('RegionScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ locale: 'es', currency: 'USD' })
  })

  it('ofrece los idiomas y las divisas que sirve el servidor', async () => {
    await renderCatalog(<RegionScreen />, contenedor())

    expect(await screen.findByText('Español')).toBeTruthy()
    expect(screen.getByText('Français')).toBeTruthy()
    expect(screen.getByText('EUR · Euro')).toBeTruthy()
  })

  it('elegir un idioma lo aplica al instante', async () => {
    await renderCatalog(<RegionScreen />, contenedor())

    fireEvent.press(await screen.findByTestId('idioma-fr'))

    expect(useSessionStore.getState().locale).toBe('fr')
  })

  /** Sin guardarla, quien pone la tienda en euros la encuentra en dólares al volver a abrirla. */
  it('la divisa elegida se guarda para el próximo arranque', async () => {
    const savePreferences = { execute: jest.fn().mockResolvedValue(undefined) }
    await renderCatalog(<RegionScreen />, contenedor(savePreferences))

    fireEvent.press(await screen.findByTestId('divisa-EUR'))

    expect(useSessionStore.getState().currency).toBe('EUR')
    await waitFor(() => expect(savePreferences.execute).toHaveBeenCalledWith({ currency: 'EUR' }))
  })

  /** Lo elegido se marca: sin la marca, la lista no dice en qué idioma está la tienda. */
  it('marca lo que está puesto', async () => {
    await renderCatalog(<RegionScreen />, contenedor())

    const actual = await screen.findByTestId('idioma-es')
    expect(actual.props.accessibilityState.selected).toBe(true)
    expect(screen.getByTestId('idioma-fr').props.accessibilityState.selected).toBe(false)
  })

  /** Mientras llegan las listas se enseña que se está pidiendo, no dos tarjetas vacías. */
  it('avisa de que está cargando', async () => {
    await renderCatalog(<RegionScreen />, {
      listLanguages: { execute: jest.fn(() => new Promise(() => {})) } as never,
      listCurrencies: { execute: jest.fn(() => new Promise(() => {})) } as never,
      savePreferences: { execute: jest.fn() } as never,
    })

    expect(screen.getByTestId('cargando-idiomas')).toBeTruthy()
    expect(screen.getByTestId('cargando-divisas')).toBeTruthy()
  })

  /**
   * Si las listas no llegan, la pantalla sigue en pie con lo que ya está puesto. Reventar aquí
   * dejaría sin salida a quien entra justo a cambiar la divisa porque los precios no le cuadran.
   */
  it('aguanta que el servidor no sirva las listas', async () => {
    await renderCatalog(<RegionScreen />, {
      listLanguages: {
        execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
      } as never,
      listCurrencies: {
        execute: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'caído'))),
      } as never,
      savePreferences: { execute: jest.fn() } as never,
    })

    expect(await screen.findByText('Idioma')).toBeTruthy()
    expect(screen.getByText('Divisa')).toBeTruthy()
    expect(screen.queryByTestId('idioma-es')).toBeNull()
  })
})
