import * as Linking from 'expo-linking'

import {
  capturedAuthLink,
  onAuthLink,
  resetIncomingLinks,
  startCapturingIncomingLinks,
} from '../incoming-link'

jest.mock('expo-linking', () => ({
  getInitialURL: jest.fn(),
  addEventListener: jest.fn(() => ({ remove: jest.fn() })),
}))

const linking = Linking as jest.Mocked<typeof Linking>

/** Dispara el evento como lo haría el sistema al entregar un enlace a la aplicación viva. */
function sistemaEntrega(url: string): void {
  const handler = linking.addEventListener.mock.calls[0]?.[1] as (e: { url: string }) => void
  handler({ url })
}

describe('captura de enlaces entrantes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    resetIncomingLinks()
    linking.addEventListener.mockReturnValue({ remove: jest.fn() } as never)
    linking.getInitialURL.mockResolvedValue(null)
  })

  it('guarda el enlace aunque todavía no lo escuche nadie', () => {
    // Este es el caso real: el sistema entrega el enlace, expo-router navega, y la pantalla que lo
    // necesita se monta después. Si el enlace no queda guardado, cuando ella llega ya no hay nada.
    startCapturingIncomingLinks()
    sistemaEntrega('nx036://auth/callback#token=a&refresh=b')

    expect(capturedAuthLink()).toBe('nx036://auth/callback#token=a&refresh=b')
  })

  it('avisa a quien se suscribe después de que el enlace haya llegado', () => {
    startCapturingIncomingLinks()
    sistemaEntrega('nx036://auth/callback#token=a&refresh=b')

    const listener = jest.fn()
    onAuthLink(listener)

    expect(capturedAuthLink()).toBe('nx036://auth/callback#token=a&refresh=b')
    expect(listener).not.toHaveBeenCalled()
  })

  it('avisa a quien ya estaba suscrito cuando el enlace llega', () => {
    startCapturingIncomingLinks()
    const listener = jest.fn()
    const unsubscribe = onAuthLink(listener)

    sistemaEntrega('nx036://auth/callback#token=a&refresh=b')
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    sistemaEntrega('nx036://auth/callback#token=c&refresh=d')
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('recoge el enlace con el que se abrió la aplicación estando cerrada', async () => {
    linking.getInitialURL.mockResolvedValue('nx036://auth/callback#token=frio&refresh=r')

    startCapturingIncomingLinks()
    await Promise.resolve()

    expect(capturedAuthLink()).toContain('token=frio')
  })

  it('ignora los enlaces que no son la vuelta del acceso', () => {
    // El cliente de desarrollo de Expo abre la aplicación con SU enlace; tomarlo por bueno dejaría
    // la pantalla esperando una sesión que viene en otro.
    startCapturingIncomingLinks()
    sistemaEntrega('nx036://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081')

    expect(capturedAuthLink()).toBeNull()
  })

  it('no se suscribe dos veces por mucho que se le llame', () => {
    startCapturingIncomingLinks()
    startCapturingIncomingLinks()
    startCapturingIncomingLinks()

    expect(linking.addEventListener).toHaveBeenCalledTimes(1)
  })

  it('no deja que un fallo al leer el enlace inicial tumbe el arranque', async () => {
    linking.getInitialURL.mockRejectedValue(new Error('sin enlace'))

    expect(() => startCapturingIncomingLinks()).not.toThrow()
    await Promise.resolve()
  })

  it('olvida el enlace al consumirlo para que no se reutilice', () => {
    startCapturingIncomingLinks()
    sistemaEntrega('nx036://auth/callback#token=a&refresh=b')

    expect(capturedAuthLink()).toBeTruthy()
    resetIncomingLinks()
    expect(capturedAuthLink()).toBeNull()
  })
})
