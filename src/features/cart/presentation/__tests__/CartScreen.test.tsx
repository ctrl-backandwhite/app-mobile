import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { ReactElement } from 'react'

import { Container } from '@composition/container'
import { ContainerProvider } from '@composition/container.provider'
import { AppConfig } from '@core/config/env'
import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { CartLine } from '@features/cart/domain/entities/cart-line'

import { CartScreen } from '../screens/CartScreen'

const CONFIG: AppConfig = {
  apiBaseUrl: 'https://api.test',
  defaultCurrency: 'EUR',
  defaultLocale: 'es',
}

function aLine(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p-1',
    slug: 'camisa-lino',
    title: 'Camisa de lino',
    quantity: 2,
    moq: 1,
    ...overrides,
  }
}

const QUOTE = {
  currency: 'EUR',
  symbol: '€',
  subtotalFormatted: '25,80 €',
  items: [{ productId: 'p-1', unitFormatted: '12,90 €', lineTotalFormatted: '25,80 €' }],
}

function deps(overrides: Record<string, unknown> = {}) {
  return {
    loadCart: { execute: jest.fn().mockResolvedValue([aLine()]) },
    loadSavedCart: { execute: jest.fn().mockResolvedValue(ok([])) },
    updateQuantity: { execute: jest.fn().mockResolvedValue([aLine({ quantity: 3 })]) },
    removeFromCart: { execute: jest.fn().mockResolvedValue([]) },
    saveForLater: { execute: jest.fn() },
    moveToCart: { execute: jest.fn() },
    quoteCart: { execute: jest.fn().mockResolvedValue(ok(QUOTE)) },
    ...overrides,
  }
}

async function mount(container: Record<string, unknown>): Promise<void> {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  await render(
    <ContainerProvider config={CONFIG} value={container as unknown as Container}>
      <QueryClientProvider client={queryClient}>{(<CartScreen />) as ReactElement}</QueryClientProvider>
    </ContainerProvider>,
  )
}

describe('CartScreen', () => {
  it('pinta las líneas de la cesta con el importe que devuelve el backend', async () => {
    await mount(deps())

    expect(await screen.findByText('Camisa de lino')).toBeTruthy()
    // Dos veces a propósito: el importe de la línea y el subtotal del resumen, ambos formateados
    // por el backend.
    expect(await screen.findAllByText('25,80 €')).toHaveLength(2)
  })

  it('pide el presupuesto al backend en lugar de sumar importes', async () => {
    const container = deps()
    await mount(container)

    // La cesta no guarda precios: el total sale siempre de una llamada al servidor.
    await waitFor(() => expect(container.quoteCart.execute).toHaveBeenCalled())
  })

  it('carga lo guardado para más tarde desde el servidor', async () => {
    // Es lo que hace que apartar un producto desde el panel web se vea también aquí.
    const container = deps({
      loadCart: { execute: jest.fn().mockResolvedValue([]) },
      loadSavedCart: { execute: jest.fn().mockResolvedValue(ok([aLine({ title: 'Botas' })])) },
    })
    await mount(container)

    expect(await screen.findByText('Botas')).toBeTruthy()
  })

  it('avisa cuando la cesta está vacía', async () => {
    await mount(
      deps({
        loadCart: { execute: jest.fn().mockResolvedValue([]) },
        loadSavedCart: { execute: jest.fn().mockResolvedValue(ok([])) },
      }),
    )

    await waitFor(() => expect(screen.getByText(/cesta está vacía|Tu cesta/i)).toBeTruthy())
  })

  it('mantiene la línea en la cesta si guardar para más tarde falla', async () => {
    // Lo importante no es el aviso, es que la línea no desaparezca de los dos sitios a la vez.
    const container = deps({
      saveForLater: {
        execute: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'Sin conexión'))),
      },
    })
    await mount(container)

    await fireEvent.press(await screen.findByLabelText(/Guardar .* para más tarde/i))

    expect(await screen.findByText('Sin conexión')).toBeTruthy()
    expect(screen.getByText('Camisa de lino')).toBeTruthy()
  })
})
