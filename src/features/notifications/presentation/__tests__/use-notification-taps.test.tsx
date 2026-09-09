import { render, waitFor } from '@testing-library/react-native'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'
import { Text } from 'react-native'

import { useNotificationTaps } from '../hooks/use-notification-taps'

jest.mock('expo-notifications', () => ({
  // `setNotificationHandler` se ejecuta al IMPORTAR el módulo, así que tiene que existir en el
  // sustituto o la suite entera no llega ni a cargarse.
  setNotificationHandler: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
}))

const avisos = Notifications as jest.Mocked<typeof Notifications>

function Probe(): React.ReactElement {
  useNotificationTaps()
  return <Text>listo</Text>
}

describe('useNotificationTaps', () => {
  let quitar: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    quitar = jest.fn()
    avisos.getLastNotificationResponseAsync.mockResolvedValue(null)
    avisos.addNotificationResponseReceivedListener.mockReturnValue({ remove: quitar } as never)
  })

  /**
   * Es el caso más común: el aviso llega justo cuando no se está mirando el teléfono, así que la
   * aplicación estaba cerrada. Esa respuesta ya ocurrió antes de arrancar y ningún oyente la anuncia.
   */
  it('abre el buzón cuando el aviso arrancó la aplicación', async () => {
    avisos.getLastNotificationResponseAsync.mockResolvedValue({ notification: {} } as never)

    await render(<Probe />)

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/notifications'))
  })

  it('abre el buzón al tocar un aviso con la aplicación abierta', async () => {
    await render(<Probe />)

    const alTocar = avisos.addNotificationResponseReceivedListener.mock.calls[0]?.[0]
    alTocar?.({} as never)

    expect(router.push).toHaveBeenCalledWith('/notifications')
  })

  it('no navega sola cuando nadie ha tocado nada', async () => {
    await render(<Probe />)

    await waitFor(() => expect(avisos.addNotificationResponseReceivedListener).toHaveBeenCalled())
    expect(router.push).not.toHaveBeenCalled()
  })

  /** Sin retirar el oyente, cada montaje dejaría uno vivo y un toque abriría el buzón N veces. */
  it('retira el oyente al desmontar', async () => {
    const vista = await render(<Probe />)

    await vista.unmount()

    expect(quitar).toHaveBeenCalled()
  })
})
