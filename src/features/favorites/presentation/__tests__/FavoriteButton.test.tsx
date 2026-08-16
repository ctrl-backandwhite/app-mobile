import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'

import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'
import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { FavoriteButton } from '../components/FavoriteButton'
import { useFavoritesStore } from '../state/favorites.store'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  defaultCurrency: 'USD',
  defaultLocale: 'es',
}

async function renderButton(toggleFavorite: unknown) {
  return render(
    <ContainerProvider config={CONFIG} value={{ toggleFavorite } as Container}>
      <FavoriteButton productId="p-1" />
    </ContainerProvider>,
  )
}

describe('FavoriteButton', () => {
  beforeEach(() => useFavoritesStore.getState().clear())

  it('marca el producto en el acto, sin esperar al servidor', async () => {
    // La respuesta se deja en el aire a propósito para comprobar que el corazón cambia ANTES de que
    // el servidor conteste. `fireEvent` espera al manejador, así que se lanza sin aguardarlo y se
    // libera la respuesta al final.
    let responder = (): void => undefined
    const pendiente = new Promise((resolve) => {
      responder = () => resolve(ok(true))
    })
    const toggleFavorite = { execute: jest.fn(() => pendiente) }
    await renderButton(toggleFavorite)

    void fireEvent.press(screen.getByLabelText('Añadir a favoritos'))

    await waitFor(() => expect(useFavoritesStore.getState().ids.has('p-1')).toBe(true))
    expect(screen.getByLabelText('Quitar de favoritos')).toBeTruthy()
    responder()
  })

  it('desmarca un producto ya marcado', async () => {
    useFavoritesStore.getState().replaceAll(['p-1'])
    const toggleFavorite = { execute: jest.fn().mockResolvedValue(ok(false)) }
    await renderButton(toggleFavorite)

    await fireEvent.press(screen.getByLabelText('Quitar de favoritos'))

    await waitFor(() => expect(useFavoritesStore.getState().ids.has('p-1')).toBe(false))
    expect(toggleFavorite.execute).toHaveBeenCalledWith('p-1', true)
  })

  it('deshace el cambio si el servidor lo rechaza', async () => {
    // El corazón no puede quedarse contando algo que no se guardó.
    const toggleFavorite = {
      execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
    }
    await renderButton(toggleFavorite)

    await fireEvent.press(screen.getByLabelText('Añadir a favoritos'))

    await waitFor(() => expect(useFavoritesStore.getState().ids.has('p-1')).toBe(false))
    expect(screen.getByLabelText('Añadir a favoritos')).toBeTruthy()
  })

  it('ignora las pulsaciones mientras hay una en curso', async () => {
    let responder = (): void => undefined
    const pendiente = new Promise((resolve) => {
      responder = () => resolve(ok(true))
    })
    const toggleFavorite = { execute: jest.fn(() => pendiente) }
    await renderButton(toggleFavorite)

    void fireEvent.press(screen.getByLabelText('Añadir a favoritos'))
    await waitFor(() => expect(screen.getByLabelText('Quitar de favoritos')).toBeTruthy())
    void fireEvent.press(screen.getByLabelText('Quitar de favoritos'))

    // Pulsar dos veces seguidas no puede lanzar dos llamadas: dejaría el servidor y la pantalla
    // contando cosas distintas.
    expect(toggleFavorite.execute).toHaveBeenCalledTimes(1)
    responder()
  })
})

describe('favorites.store', () => {
  beforeEach(() => useFavoritesStore.getState().clear())

  it('cambia la referencia del conjunto en cada modificación', () => {
    // Mutar el conjunto en vez de recrearlo dejaría las tarjetas sin repintar.
    useFavoritesStore.getState().replaceAll(['p-1'])
    const antes = useFavoritesStore.getState().ids

    useFavoritesStore.getState().mark('p-2')

    expect(useFavoritesStore.getState().ids).not.toBe(antes)
    expect(useFavoritesStore.getState().ids.has('p-1')).toBe(true)
  })

  it('se vacía al limpiar, para que otra cuenta no herede corazones ajenos', () => {
    useFavoritesStore.getState().replaceAll(['p-1', 'p-2'])

    useFavoritesStore.getState().clear()

    expect(useFavoritesStore.getState().ids.size).toBe(0)
    expect(useFavoritesStore.getState().loaded).toBe(false)
  })
})
