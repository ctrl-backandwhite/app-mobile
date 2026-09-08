import { act, fireEvent, screen } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'
import { PlatformNotification } from '@features/notifications/domain/entities/notification'

import { NotificationsScreen } from '../screens/NotificationsScreen'

function aviso(overrides: Partial<PlatformNotification> = {}): PlatformNotification {
  return {
    id: 'n-1',
    title: 'Tu pedido va en camino',
    body: 'NX-2026-0001 ha salido del almacén.',
    eventType: 'ORDER_SHIPPED',
    read: false,
    createdAt: '2026-09-06T10:00:00Z',
    ...overrides,
  }
}

interface Dobles {
  listNotifications: { execute: jest.Mock }
  markNotificationRead: { execute: jest.Mock }
  markAllNotificationsRead: { execute: jest.Mock }
  archiveNotification: { execute: jest.Mock }
  enablePushNotifications: { execute: jest.Mock }
}

function contenedor(
  bandeja: Result<PlatformNotification[], AppError> = ok([aviso()]),
): Dobles {
  return {
    listNotifications: { execute: jest.fn().mockResolvedValue(bandeja) },
    markNotificationRead: { execute: jest.fn().mockResolvedValue(ok(undefined)) },
    markAllNotificationsRead: { execute: jest.fn().mockResolvedValue(ok(undefined)) },
    archiveNotification: { execute: jest.fn().mockResolvedValue(ok(undefined)) },
    enablePushNotifications: { execute: jest.fn().mockResolvedValue(ok(true)) },
  }
}

async function pulsa(testID: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID))
  })
}

/**
 * Es el buzón DENTRO de la aplicación, no un aviso del sistema: aquí llegan los cambios de estado de
 * un pedido y los mensajes de la plataforma.
 */
describe('NotificationsScreen', () => {
  it('enseña los avisos de la bandeja', async () => {
    await renderCatalog(<NotificationsScreen />, contenedor() as never)

    expect(await screen.findByText('Tu pedido va en camino')).toBeTruthy()
    expect(screen.getByText('NX-2026-0001 ha salido del almacén.')).toBeTruthy()
  })

  /** Un punto y un fondo distinto: una negrita a media pantalla no se ve al mirar de pasada. */
  it('distingue lo que está sin leer', async () => {
    await renderCatalog(
      <NotificationsScreen />,
      contenedor(ok([aviso(), aviso({ id: 'n-2', read: true })])) as never,
    )

    await screen.findByTestId('aviso-n-1')
    expect(screen.getByTestId('sin-leer-n-1')).toBeTruthy()
    expect(screen.queryByTestId('sin-leer-n-2')).toBeNull()
  })

  it('dice cuántos quedan sin leer', async () => {
    await renderCatalog(
      <NotificationsScreen />,
      contenedor(ok([aviso(), aviso({ id: 'n-2' }), aviso({ id: 'n-3', read: true })])) as never,
    )

    expect(await screen.findByText('2 sin leer')).toBeTruthy()
  })

  it('no ofrece marcar todo cuando no queda nada sin leer', async () => {
    await renderCatalog(<NotificationsScreen />, contenedor(ok([aviso({ read: true })])) as never)

    await screen.findByTestId('aviso-n-1')
    expect(screen.queryByTestId('marcar-todo-leido')).toBeNull()
  })

  /** Leerlo ES abrirlo: un botón aparte sería pedir dos gestos para una sola intención. */
  it('tocar un aviso lo marca como leído y recarga la bandeja', async () => {
    const deps = contenedor()
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('abrir-aviso-n-1')

    expect(deps.markNotificationRead.execute).toHaveBeenCalledWith('n-1')
    expect(deps.listNotifications.execute).toHaveBeenCalledTimes(2)
  })

  it('no vuelve a marcar uno que ya estaba leído', async () => {
    const deps = contenedor(ok([aviso({ read: true })]))
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('abrir-aviso-n-1')

    expect(deps.markNotificationRead.execute).not.toHaveBeenCalled()
  })

  it('marca todo como leído', async () => {
    const deps = contenedor()
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('marcar-todo-leido')

    expect(deps.markAllNotificationsRead.execute).toHaveBeenCalled()
    expect(deps.listNotifications.execute).toHaveBeenCalledTimes(2)
  })

  it('archiva un aviso y recarga', async () => {
    const deps = contenedor()
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('archivar-n-1')

    expect(deps.archiveNotification.execute).toHaveBeenCalledWith('n-1')
    expect(deps.listNotifications.execute).toHaveBeenCalledTimes(2)
  })

  it('dice qué aparecerá aquí cuando no hay nada', async () => {
    await renderCatalog(<NotificationsScreen />, contenedor(ok([])) as never)

    expect(await screen.findByText('No tienes avisos')).toBeTruthy()
  })

  it('ofrece reintentar si la bandeja no llega', async () => {
    const deps = contenedor(err(new AppError('NETWORK', 'sin conexión')))
    await renderCatalog(<NotificationsScreen />, deps as never)

    expect(await screen.findByText('No se han podido cargar tus avisos')).toBeTruthy()

    await act(async () => {
      fireEvent.press(screen.getByText('Reintentar'))
    })

    expect(deps.listNotifications.execute).toHaveBeenCalledTimes(2)
  })

  it('deslizar hacia abajo vuelve a pedir la bandeja', async () => {
    const deps = contenedor()
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await act(async () => {
      fireEvent(screen.getByTestId('avisos'), 'refresh')
    })

    expect(deps.listNotifications.execute).toHaveBeenCalledTimes(2)
  })

  it('aguanta un aviso sin cuerpo', async () => {
    await renderCatalog(<NotificationsScreen />, contenedor(ok([aviso({ body: '' })])) as never)

    expect(await screen.findByText('Tu pedido va en camino')).toBeTruthy()
  })

  /**
   * Si el servidor rechaza el cambio y no se dice nada, el aviso se queda como estaba y parece que la
   * app ignora los toques.
   */
  it('cuenta por qué no se ha podido archivar', async () => {
    const deps = contenedor()
    deps.archiveNotification.execute.mockResolvedValue(
      err(new AppError('SERVER', 'No se ha podido archivar.')),
    )
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('archivar-n-1')

    expect(await screen.findByText('No se ha podido archivar.')).toBeTruthy()
  })

  it('cuenta por qué no se ha podido marcar como leído', async () => {
    const deps = contenedor()
    deps.markNotificationRead.execute.mockResolvedValue(
      err(new AppError('NETWORK', 'sin conexión')),
    )
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('abrir-aviso-n-1')

    expect(await screen.findByText('sin conexión')).toBeTruthy()
  })

  it('cuenta por qué no se ha podido marcar todo', async () => {
    const deps = contenedor()
    deps.markAllNotificationsRead.execute.mockResolvedValue(
      err(new AppError('SERVER', 'caído')),
    )
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await pulsa('marcar-todo-leido')

    expect(await screen.findByText('caído')).toBeTruthy()
  })

  /**
   * El permiso se pide desde AQUÍ y no al arrancar: un diálogo de permisos en el primer segundo se
   * deniega casi siempre, y en iOS solo se puede preguntar una vez.
   */
  it('activa los avisos del móvil desde el interruptor', async () => {
    const deps = contenedor()
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await act(async () => {
      fireEvent(screen.getByTestId('avisos-en-el-movil'), 'valueChange', true)
    })

    expect(deps.enablePushNotifications.execute).toHaveBeenCalled()
    expect(screen.getByTestId('avisos-en-el-movil').props.value).toBe(true)
  })

  /**
   * Quien no ha recibido ningún aviso todavía es justo quien más necesita poder activarlos: esconder
   * el interruptor hasta tener avisos sería pedir que ocurra lo que se quiere que avise.
   */
  it('deja activar los avisos también con la bandeja vacía', async () => {
    const deps = contenedor(ok([]))
    await renderCatalog(<NotificationsScreen />, deps as never)

    expect(await screen.findByTestId('avisos-en-el-movil')).toBeTruthy()
    expect(screen.getByText('No tienes avisos')).toBeTruthy()
  })

  /** Que no se activen es NORMAL —permiso denegado, emulador—; se dice sin alarmar y sin romper nada. */
  it('avisa cuando el dispositivo no puede recibir avisos', async () => {
    const deps = contenedor()
    deps.enablePushNotifications.execute.mockResolvedValue(ok(false))
    await renderCatalog(<NotificationsScreen />, deps as never)
    await screen.findByTestId('aviso-n-1')

    await act(async () => {
      fireEvent(screen.getByTestId('avisos-en-el-movil'), 'valueChange', true)
    })

    expect(
      await screen.findByText('No se han podido activar los avisos en este dispositivo.'),
    ).toBeTruthy()
    expect(screen.getByTestId('avisos-en-el-movil').props.value).toBe(false)
  })
})
