import { render, waitFor } from '@testing-library/react-native'
import { Text } from 'react-native'

import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'
import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { CartLine } from '@features/cart/domain/entities/cart-line'
import { HttpCartMerger } from '@features/cart/data/repositories/http-cart-merger'

import { useMergeGuestCart } from '../hooks/use-merge-guest-cart'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  webBaseUrl: 'https://nx036.test',
  defaultCurrency: 'EUR',
  defaultLocale: 'es',
}

const GUEST: CartLine[] = [{ productId: 'p-1', slug: 'camisa', title: 'Camisa', quantity: 3 }]

function Probe(): React.ReactElement {
  useMergeGuestCart()
  return <Text>listo</Text>
}

function deps(overrides: Record<string, unknown> = {}) {
  return {
    mergeGuestLines: { execute: jest.fn().mockResolvedValue(ok(GUEST)) },
    cartStorage: {
      guestLines: jest.fn().mockResolvedValue(GUEST),
      clearGuest: jest.fn().mockResolvedValue(undefined),
    },
    ...overrides,
  }
}

async function mount(container: Record<string, unknown>): Promise<void> {
  await render(
    <ContainerProvider config={CONFIG} value={container as unknown as Container}>
      <Probe />
    </ContainerProvider>,
  )
}

describe('useMergeGuestCart', () => {
  beforeEach(() => {
    useSessionStore.setState({ status: 'authenticated', user: null, accessToken: 'a', refreshToken: 'r' })
  })

  it('sube la cesta del invitado al iniciar sesión y luego la borra del dispositivo', async () => {
    const container = deps()
    await mount(container)

    await waitFor(() => expect(container.mergeGuestLines.execute).toHaveBeenCalledWith(GUEST))
    // El borrado local va DESPUÉS de la confirmación: al revés, un fallo de red dejaría a la
    // persona sin lo que había puesto en ninguno de los dos sitios.
    await waitFor(() => expect(container.cartStorage.clearGuest).toHaveBeenCalled())
  })

  it('no borra la cesta local si el servidor rechaza la fusión', async () => {
    const container = deps({
      mergeGuestLines: {
        execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
      },
    })
    await mount(container)

    await waitFor(() => expect(container.mergeGuestLines.execute).toHaveBeenCalled())
    expect(container.cartStorage.clearGuest).not.toHaveBeenCalled()
  })

  it('no llama al servidor cuando no hay nada del invitado', async () => {
    const container = deps({
      cartStorage: { guestLines: jest.fn().mockResolvedValue([]), clearGuest: jest.fn() },
    })
    await mount(container)

    await waitFor(() => expect(container.cartStorage.guestLines).toHaveBeenCalled())
    expect(container.mergeGuestLines.execute).not.toHaveBeenCalled()
  })

  it('no funde nada mientras no hay sesión', async () => {
    useSessionStore.setState({ status: 'anonymous', user: null, accessToken: null, refreshToken: null })
    const container = deps()

    await mount(container)

    expect(container.cartStorage.guestLines).not.toHaveBeenCalled()
  })
})

describe('HttpCartMerger', () => {
  it('traduce un fallo del servidor sin dar la fusión por hecha', async () => {
    const http = { post: jest.fn().mockRejectedValue(new Error('roto')) }
    const merger = new HttpCartMerger(http as never)

    const result = await merger.merge(GUEST)

    expect(result.ok).toBe(false)
  })

  it('devuelve la cesta que resulta de fundir', async () => {
    const http = {
      post: jest.fn().mockResolvedValue([
        { productId: 'p-1', slug: 'camisa', title: 'Camisa', quantity: 5 },
      ]),
    }
    const merger = new HttpCartMerger(http as never)

    const result = await merger.merge(GUEST)

    // Cinco y no tres: el servidor suma lo del invitado con lo que ya hubiera en la cuenta.
    expect(result.ok && result.value[0]?.quantity).toBe(5)
  })
})
