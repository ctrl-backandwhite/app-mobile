import { act, fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'

import { aUser } from '@features/auth/domain/testing/fake-auth-repository'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'

import { AccountScreen } from '../screens/AccountScreen'

/**
 * La pestaña de cuenta.
 *
 * <p>Sustituye a la pantalla de bienvenida de la primera entrega, que era un saludo con dos botones y
 * llevaba meses haciendo de «Cuenta» sin serlo.
 */
describe('AccountScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({
      user: aUser({ email: 'ana@nx036.com', country: 'ES', role: 'USER' }),
      locale: 'es',
      currency: 'EUR',
      status: 'authenticated',
    })
  })

  /**
   * Pulsar deja trabajo de React pendiente, y el segundo `fireEvent` de una misma prueba abre su
   * ámbito de `act` encima del anterior sin cerrar. React avisa con «overlapping act() calls» —por
   * consola, sin romper nada— y a partir de ahí los montajes de las pruebas SIGUIENTES salen vacíos:
   * fallan con «Unable to find» y pasan en solitario, que es el peor síntoma posible.
   *
   * <p>Envolver cada pulsación y esperarla cierra el ámbito antes de abrir el siguiente.
   */
  async function pulsa(testID: string): Promise<void> {
    await act(async () => {
      fireEvent.press(screen.getByTestId(testID))
    })
  }

  it('presenta a quien ha entrado', async () => {
    await renderCatalog(<AccountScreen />, { signOut: { execute: jest.fn() } as never })

    expect(screen.getByText('ana@nx036.com')).toBeTruthy()
  })

  /** Los tres accesos que dan sentido a la pestaña: a dónde se vuelve en una tienda. */
  it('lleva a pedidos, a guardados y a los ajustes de región', async () => {
    await renderCatalog(<AccountScreen />, { signOut: { execute: jest.fn() } as never })

    await pulsa('ir-a-pedidos')
    expect(router.push).toHaveBeenCalledWith('/orders')

    await pulsa('ir-a-guardados')
    expect(router.push).toHaveBeenCalledWith('/favorites')

    await pulsa('ir-a-region')
    expect(router.push).toHaveBeenCalledWith('/settings/region')
  })

  /**
   * El idioma y la divisa se enseñan SIN abrir nada: son el ajuste que decide los importes que se
   * leen antes de comprar, y tener que entrar para saberlos sería esconderlos.
   */
  it('enseña el idioma y la divisa puestos, sin abrir el ajuste', async () => {
    await renderCatalog(<AccountScreen />, { signOut: { execute: jest.fn() } as never })

    expect(screen.getByText('ES · EUR')).toBeTruthy()
  })

  /** Al personal interno se le dice que el back-office no está aquí, en vez de dejarle buscarlo. */
  it('avisa al personal interno de que el panel no está en la app', async () => {
    useSessionStore.setState({ user: aUser({ role: 'ADMIN' }) })

    await renderCatalog(<AccountScreen />, { signOut: { execute: jest.fn() } as never })

    expect(screen.getByText(/back-office no se sirve desde la aplicación/)).toBeTruthy()
  })

  it('cerrar sesión vacía el estado y lleva al acceso', async () => {
    const signOut = { execute: jest.fn().mockResolvedValue(undefined) }
    await renderCatalog(<AccountScreen />, { signOut: signOut as never })

    await act(async () => {
      fireEvent.press(screen.getByText('Cerrar sesión'))
    })

    await screen.findByTestId('cuenta-vacia')
    expect(signOut.execute).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/login')
  })
})
