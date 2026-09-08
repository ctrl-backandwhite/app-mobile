import { act, fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'

import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'
import { RechargeOptions } from '@features/checkout/domain/entities/wallet-recharge'
import { RechargeOutcome } from '@features/checkout/domain/usecases/recharge-wallet'

import { RechargeScreen } from '../screens/RechargeScreen'

const OPCIONES: RechargeOptions = {
  currency: 'EUR',
  symbol: '€',
  presets: [
    { amount: 25, formatted: '25,00 €' },
    { amount: 50, formatted: '50,00 €' },
  ],
}

interface Dobles {
  getRechargeOptions: { execute: jest.Mock }
  rechargeWallet: { execute: jest.Mock }
}

function contenedor(
  opciones: Result<RechargeOptions, AppError> = ok(OPCIONES),
  recarga: Result<RechargeOutcome, AppError> = ok('recharged'),
): Dobles {
  return {
    getRechargeOptions: { execute: jest.fn().mockResolvedValue(opciones) },
    rechargeWallet: { execute: jest.fn().mockResolvedValue(recarga) },
  }
}

async function pulsa(testID: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID))
  })
}

async function escribe(valor: string): Promise<void> {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId('importe-recarga'), valor)
  })
}

describe('RechargeScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ currency: 'EUR' })
  })

  it('ofrece los importes que sugiere el servidor', async () => {
    await renderCatalog(<RechargeScreen />, contenedor() as never)

    expect(await screen.findByText('25,00 €')).toBeTruthy()
    expect(screen.getByText('50,00 €')).toBeTruthy()
  })

  it('pide las sugerencias en la divisa que está puesta', async () => {
    const deps = contenedor()
    await renderCatalog(<RechargeScreen />, deps as never)

    await screen.findByText('25,00 €')
    expect(deps.getRechargeOptions.execute).toHaveBeenCalledWith('EUR')
  })

  it('elegir un sugerido rellena el importe', async () => {
    const deps = contenedor()
    await renderCatalog(<RechargeScreen />, deps as never)
    await screen.findByTestId('sugerido-50')

    await pulsa('sugerido-50')
    await pulsa('recargar')

    expect(deps.rechargeWallet.execute).toHaveBeenCalledWith({
      method: 'CARD',
      amount: 50,
      currency: 'EUR',
    })
  })

  it('no deja recargar sin importe', async () => {
    const deps = contenedor()
    await renderCatalog(<RechargeScreen />, deps as never)

    await pulsa('recargar')

    expect(deps.rechargeWallet.execute).not.toHaveBeenCalled()
  })

  /** La coma decimal es lo que sale del teclado en español; el número no la entiende. */
  it('entiende un importe escrito con coma', async () => {
    const deps = contenedor()
    await renderCatalog(<RechargeScreen />, deps as never)

    await escribe('12,50')
    await pulsa('recargar')

    expect(deps.rechargeWallet.execute).toHaveBeenCalledWith({
      method: 'CARD',
      amount: 12.5,
      currency: 'EUR',
    })
  })

  it('deja pagar con PayPal', async () => {
    const deps = contenedor()
    await renderCatalog(<RechargeScreen />, deps as never)

    await escribe('30')
    await pulsa('metodo-PAYPAL')
    await pulsa('recargar')

    expect(deps.rechargeWallet.execute).toHaveBeenCalledWith({
      method: 'PAYPAL',
      amount: 30,
      currency: 'EUR',
    })
  })

  it('vuelve al monedero cuando la recarga sale bien', async () => {
    await renderCatalog(<RechargeScreen />, contenedor() as never)

    await escribe('25')
    await pulsa('recargar')

    expect(router.back).toHaveBeenCalled()
  })

  /** Salir sin pagar no es un fallo, y el importe se conserva para no tener que teclearlo otra vez. */
  it('avisa sin alarmar cuando se sale de la pasarela sin pagar', async () => {
    await renderCatalog(<RechargeScreen />, contenedor(ok(OPCIONES), ok('cancelled')) as never)

    await escribe('25')
    await pulsa('recargar')

    expect(await screen.findByText('Has salido sin pagar. El saldo no ha cambiado.')).toBeTruthy()
    expect(router.back).not.toHaveBeenCalled()
    expect(screen.getByTestId('importe-recarga').props.value).toBe('25')
  })

  it('cuenta por qué no se ha podido recargar', async () => {
    await renderCatalog(
      <RechargeScreen />,
      contenedor(ok(OPCIONES), err(new AppError('SERVER', 'La pasarela ha rechazado el pago.'))) as never,
    )

    await escribe('25')
    await pulsa('recargar')

    expect(await screen.findByText('La pasarela ha rechazado el pago.')).toBeTruthy()
    expect(router.back).not.toHaveBeenCalled()
  })

  /** Sin sugerencias se sigue pudiendo recargar: el importe libre es lo único imprescindible. */
  it('funciona aunque las sugerencias no lleguen', async () => {
    const deps = contenedor(err(new AppError('NETWORK', 'sin conexión')))
    await renderCatalog(<RechargeScreen />, deps as never)

    await escribe('40')
    await pulsa('recargar')

    expect(deps.rechargeWallet.execute).toHaveBeenCalledWith({
      method: 'CARD',
      amount: 40,
      currency: 'EUR',
    })
  })
})
