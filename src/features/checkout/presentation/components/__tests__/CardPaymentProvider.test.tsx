import { screen, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'

import { ok } from '@core/result/result'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { renderCheckout } from '../../testing/render-checkout'
import { CardPaymentProvider } from '../CardPaymentProvider'

const CHILD = 'la aplicación'

function deps(execute: jest.Mock) {
  return { getBillingConfig: { execute } }
}

function child() {
  return (
    <CardPaymentProvider>
      <Text>{CHILD}</Text>
    </CardPaymentProvider>
  )
}

describe('CardPaymentProvider', () => {
  // Se devuelve al estado inicial ANTES de montar nada: hacerlo al terminar avisaría a un componente
  // todavía montado y React lo reprocharía como un cambio de estado fuera de `act`.
  beforeEach(() => useSessionStore.setState({ status: 'loading' }))

  it('arranca la pasarela con la clave que sirve el backend', async () => {
    useSessionStore.setState({ status: 'authenticated' })
    const execute = jest.fn().mockResolvedValue(ok({ publishableKey: 'pk_test_del_backend', enabled: true }))
    await renderCheckout(child(), deps(execute))

    // La clave que llega al SDK es exactamente la que devolvió el backend, no una escrita en el código.
    const provider = await screen.findByTestId('stripe-provider')
    expect(provider.props.publishableKey).toBe('pk_test_del_backend')
    expect(screen.getByText(CHILD)).toBeTruthy()
  })

  it('pinta la aplicación igual mientras la clave no ha llegado', async () => {
    // Ni el catálogo ni la cesta ni los pedidos dependen de poder cobrar: no tienen por qué esperar.
    useSessionStore.setState({ status: 'authenticated' })
    await renderCheckout(child(), deps(jest.fn(() => new Promise(() => undefined))))

    expect(await screen.findByText(CHILD)).toBeTruthy()
    expect(screen.queryByTestId('stripe-provider')).toBeNull()
  })

  it('no pide la clave mientras no hay sesión', async () => {
    // El endpoint es del perfil: pedirlo sin credenciales solo produce un 401.
    useSessionStore.setState({ status: 'anonymous' })
    const execute = jest.fn()
    await renderCheckout(child(), deps(execute))

    expect(await screen.findByText(CHILD)).toBeTruthy()
    await waitFor(() => expect(execute).not.toHaveBeenCalled())
  })
})
