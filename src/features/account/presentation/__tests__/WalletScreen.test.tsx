import { act, fireEvent, screen } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { Page } from '@features/catalog/domain/entities/page'
import { WalletBalance } from '@features/checkout/domain/entities/wallet'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'
import { WalletTransaction } from '@features/checkout/domain/entities/wallet-transaction'

import { WalletScreen } from '../screens/WalletScreen'

const SALDO = {
  availableUsdCents: 12000,
  balanceFormatted: '110,40 €',
  currency: 'EUR',
  status: 'ACTIVE',
}

function apunte(overrides: Partial<WalletTransaction> = {}): WalletTransaction {
  return {
    id: 't-1',
    kind: 'PAYMENT',
    amountFormatted: '-$45.00',
    balanceAfterFormatted: '$75.00',
    esEntrada: false,
    description: 'Pedido NX-2026-0001',
    createdAt: '2026-09-01T10:00:00Z',
    ...overrides,
  }
}

function pagina(items: WalletTransaction[], totalPages = 1): Page<WalletTransaction> {
  return { items, page: 0, size: 20, totalElements: items.length, totalPages }
}

interface Dobles {
  getWalletBalance: { execute: jest.Mock }
  listWalletTransactions: { execute: jest.Mock }
}

/**
 * Los tipos van escritos y no inferidos: con los valores por defecto, TypeScript fijaba el error de
 * los `Result` en `never` y cualquier prueba que pasara un fallo dejaba de compilar. Las pruebas
 * seguían en verde porque Jest no mira los tipos, y solo lo cazaba `tsc`.
 */
function contenedor(
  saldo: Result<WalletBalance, AppError> = ok(SALDO),
  movimientos: Result<Page<WalletTransaction>, AppError> = ok(pagina([apunte()])),
): Dobles {
  return {
    getWalletBalance: { execute: jest.fn().mockResolvedValue(saldo) },
    listWalletTransactions: { execute: jest.fn().mockResolvedValue(movimientos) },
  }
}

/**
 * En esta plataforma se paga con monedero, así que cuando un pedido no sale el primer sitio al que
 * se mira es este. Sin histórico, «me han cobrado dos veces» no se puede ni comprobar ni desmentir.
 */
describe('WalletScreen', () => {
  it('enseña el saldo ya formateado por el servidor', async () => {
    await renderCatalog(<WalletScreen />, contenedor() as never)

    // La app NO convierte divisas: pinta la cadena que manda el backend en la moneda de la persona.
    expect(await screen.findByText('110,40 €')).toBeTruthy()
  })

  it('lista los movimientos con su concepto y su importe', async () => {
    await renderCatalog(<WalletScreen />, contenedor() as never)

    expect(await screen.findByText('Pago de pedido')).toBeTruthy()
    expect(screen.getByText('Pedido NX-2026-0001')).toBeTruthy()
    expect(screen.getByText('-$45.00')).toBeTruthy()
    expect(screen.getByText('$75.00')).toBeTruthy()
  })

  /** Lo retenido solo se enseña si de verdad hay algo: un «Retenido: 0,00 $» inquieta sin motivo. */
  it('avisa de lo retenido cuando lo hay', async () => {
    await renderCatalog(<WalletScreen />, contenedor(ok({ ...SALDO, holdFormatted: '$20.00' })) as never)

    expect(await screen.findByText(/Retenido por operaciones en curso: \$20\.00/)).toBeTruthy()
  })

  it('no habla de retenciones cuando no hay ninguna', async () => {
    await renderCatalog(<WalletScreen />, contenedor() as never)

    await screen.findByText('110,40 €')
    expect(screen.queryByText(/Retenido/)).toBeNull()
  })

  it('dice que no hay nada cuando el monedero está recién abierto', async () => {
    await renderCatalog(<WalletScreen />, contenedor(ok(SALDO), ok(pagina([], 0))) as never)

    expect(await screen.findByText('Todavía no hay movimientos.')).toBeTruthy()
  })

  it('ofrece reintentar si el histórico no llega', async () => {
    await renderCatalog(
      <WalletScreen />,
      contenedor(ok(SALDO), err(new AppError('NETWORK', 'sin conexión'))) as never,
    )

    expect(await screen.findByText('No se ha podido cargar tu monedero')).toBeTruthy()
    expect(screen.getByText('Reintentar')).toBeTruthy()
  })

  /**
   * Si el saldo no llega pero los movimientos sí, la pantalla sigue sirviendo: el histórico es lo que
   * se viene a consultar. Un guion dice «no lo sé» sin fingir un cero que no es cierto.
   */
  it('aguanta que el saldo no llegue', async () => {
    await renderCatalog(
      <WalletScreen />,
      contenedor(err(new AppError('SERVER', 'caído')), ok(pagina([apunte()]))) as never,
    )

    expect(await screen.findByText('Pago de pedido')).toBeTruthy()
    expect(screen.getByTestId('saldo').props.children).toBe('—')
  })

  it('reintenta cuando se le pide', async () => {
    const listWalletTransactions = {
      execute: jest
        .fn()
        .mockResolvedValueOnce(err(new AppError('NETWORK', 'sin conexión')))
        .mockResolvedValue(ok(pagina([apunte()]))),
    }
    await renderCatalog(<WalletScreen />, {
      getWalletBalance: { execute: jest.fn().mockResolvedValue(ok(SALDO)) } as never,
      listWalletTransactions: listWalletTransactions as never,
    })

    await act(async () => {
      fireEvent.press(await screen.findByText('Reintentar'))
    })

    expect(await screen.findByText('Pago de pedido')).toBeTruthy()
  })

  /** Deslizar hacia abajo actualiza LAS DOS cosas: un saldo viejo junto a un apunte nuevo no cuadra. */
  it('al deslizar vuelve a pedir el saldo y los movimientos', async () => {
    const deps = contenedor()
    await renderCatalog(<WalletScreen />, deps as never)
    await screen.findByText('Pago de pedido')

    await act(async () => {
      fireEvent(screen.getByTestId('movimientos'), 'refresh')
    })

    expect(deps.getWalletBalance.execute).toHaveBeenCalledTimes(2)
    expect(deps.listWalletTransactions.execute).toHaveBeenCalledTimes(2)
  })

  it('pide la página siguiente al llegar al final', async () => {
    const deps = contenedor(ok(SALDO), ok(pagina([apunte()], 3)))
    await renderCatalog(<WalletScreen />, deps as never)
    await screen.findByText('Pago de pedido')

    await act(async () => {
      fireEvent(screen.getByTestId('movimientos'), 'endReached')
    })

    expect(deps.listWalletTransactions.execute).toHaveBeenLastCalledWith(1)
  })

  it('no pide más allá de la última página', async () => {
    const deps = contenedor()
    await renderCatalog(<WalletScreen />, deps as never)
    await screen.findByText('Pago de pedido')

    await act(async () => {
      fireEvent(screen.getByTestId('movimientos'), 'endReached')
    })

    expect(deps.listWalletTransactions.execute).toHaveBeenCalledTimes(1)
  })

  /**
   * Una recarga entra y un pago sale. En una lista de movimientos lo primero que se busca es esa
   * diferencia, así que la entrada va marcada con color y no solo con el signo, que se lee mal.
   */
  it('distingue lo que entra de lo que sale y aguanta un apunte sin concepto', async () => {
    const entrada = apunte({
      id: 't-9',
      kind: 'DEPOSIT',
      amountFormatted: '+$25.00',
      esEntrada: true,
      description: undefined,
    })
    await renderCatalog(<WalletScreen />, contenedor(ok(SALDO), ok(pagina([entrada]))) as never)

    expect(await screen.findByText('Recarga')).toBeTruthy()
    expect(screen.getByText('+$25.00')).toBeTruthy()
    expect(screen.getByTestId('movimiento-t-9')).toBeTruthy()
  })
})
