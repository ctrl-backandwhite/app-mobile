import { act, fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
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

  /** Los accesos que dan sentido a la pestaña: a dónde se vuelve en una tienda. */
  it('lleva a pedidos, a guardados, al monedero y a los ajustes de región', async () => {
    await renderCatalog(<AccountScreen />, { signOut: { execute: jest.fn() } as never })

    await pulsa('ir-a-avisos')
    expect(router.push).toHaveBeenCalledWith('/notifications')

    await pulsa('ir-a-pedidos')
    expect(router.push).toHaveBeenCalledWith('/orders')

    await pulsa('ir-a-guardados')
    expect(router.push).toHaveBeenCalledWith('/favorites')

    await pulsa('ir-a-monedero')
    expect(router.push).toHaveBeenCalledWith('/wallet')

    await pulsa('ir-a-region')
    expect(router.push).toHaveBeenCalledWith('/settings/region')

    await pulsa('ir-a-seguridad')
    expect(router.push).toHaveBeenCalledWith('/settings/security')
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
    await renderCatalog(<AccountScreen />, {
      signOut: signOut as never,
      disablePushNotifications: { execute: jest.fn().mockResolvedValue(ok(undefined)) } as never,
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Cerrar sesión'))
    })

    await screen.findByTestId('cuenta-vacia')
    expect(signOut.execute).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/login')
  })

  /**
   * El dispositivo se retira ANTES de cerrar la sesión, que es cuando el token todavía vale. Sin
   * esto, el siguiente aviso de esta cuenta llegaría a un teléfono que ya no es suyo —o a manos
   * ajenas si se prestó—, y un aviso lleva su título y su cuerpo.
   */
  it('deja de recibir avisos en este teléfono ANTES de cerrar la sesión', async () => {
    const orden: string[] = []
    const disablePushNotifications = {
      execute: jest.fn(async () => {
        orden.push('baja')
        return ok(undefined)
      }),
    }
    const signOut = {
      execute: jest.fn(async () => {
        orden.push('salir')
      }),
    }
    await renderCatalog(<AccountScreen />, {
      signOut: signOut as never,
      disablePushNotifications: disablePushNotifications as never,
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Cerrar sesión'))
    })

    await screen.findByTestId('cuenta-vacia')
    expect(orden).toEqual(['baja', 'salir'])
  })

  /** Si la baja falla se cierra la sesión igual: dejar a alguien dentro sería peor. */
  it('cierra la sesión aunque no se pueda dar de baja el dispositivo', async () => {
    const signOut = { execute: jest.fn().mockResolvedValue(undefined) }
    await renderCatalog(<AccountScreen />, {
      signOut: signOut as never,
      disablePushNotifications: {
        execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
      } as never,
    })

    await act(async () => {
      fireEvent.press(screen.getByText('Cerrar sesión'))
    })

    await screen.findByTestId('cuenta-vacia')
    expect(signOut.execute).toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/login')
  })

  it('no ofrece contratar ningún plan', async () => {
    // Los planes se contratan en el escritorio. Google y Apple exigen que una suscripción vendida
    // dentro de una aplicación pase por su propio cobro —con su comisión—, así que ofrecerla aquí
    // sería motivo de rechazo en la tienda.
    await renderCatalog(<AccountScreen />, { signOut: { execute: jest.fn() } as never })

    expect(screen.queryByText('Mi plan')).toBeNull()
  })
})
