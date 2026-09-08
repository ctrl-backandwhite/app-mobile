import { act, fireEvent, screen } from '@testing-library/react-native'
import { Linking } from 'react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { Plan, Subscription } from '@features/account/domain/entities/subscription'
import { SubscriptionState } from '@features/account/domain/usecases/subscription'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'

import { SubscriptionScreen } from '../screens/SubscriptionScreen'

const PLAN: Plan = { id: 'p-1', code: 'PRO', name: 'Profesional', monthlyFormatted: '29,00 €' }

const ACTIVA: Subscription = {
  planId: 'p-1',
  status: 'ACTIVE',
  billingPeriod: 'MONTHLY',
  currentPeriodEnd: '2026-10-01T00:00:00Z',
}

interface Dobles {
  getSubscription: { execute: jest.Mock }
  cancelSubscription: { execute: jest.Mock }
}

function contenedor(
  estado: Result<SubscriptionState, AppError> = ok({ subscription: ACTIVA, plans: [PLAN] }),
  cancelacion: Result<void, AppError> = ok(undefined),
): Dobles {
  return {
    getSubscription: { execute: jest.fn().mockResolvedValue(estado) },
    cancelSubscription: { execute: jest.fn().mockResolvedValue(cancelacion) },
  }
}

async function pulsa(testID: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByTestId(testID))
  })
}

describe('SubscriptionScreen', () => {
  it('enseña el plan contratado con su estado', async () => {
    await renderCatalog(<SubscriptionScreen />, contenedor() as never)

    expect(await screen.findByText('Profesional')).toBeTruthy()
    expect(screen.getByText('Activa')).toBeTruthy()
    expect(screen.getByText('Mensual')).toBeTruthy()
  })

  it('dice que no hay plan cuando la cuenta no tiene ninguno', async () => {
    await renderCatalog(
      <SubscriptionScreen />,
      contenedor(ok({ subscription: null, plans: [PLAN] })) as never,
    )

    expect(await screen.findByText('Sin plan contratado')).toBeTruthy()
    expect(screen.queryByTestId('cancelar-suscripcion')).toBeNull()
  })

  it('cancela la suscripción y relee el estado', async () => {
    const deps = contenedor()
    await renderCatalog(<SubscriptionScreen />, deps as never)
    await screen.findByText('Profesional')

    await pulsa('cancelar-suscripcion')

    expect(deps.cancelSubscription.execute).toHaveBeenCalled()
    expect(deps.getSubscription.execute).toHaveBeenCalledTimes(2)
  })

  it('enseña el motivo si la cancelación no sale', async () => {
    await renderCatalog(
      <SubscriptionScreen />,
      contenedor(
        ok({ subscription: ACTIVA, plans: [PLAN] }),
        err(new AppError('SERVER', 'No se ha podido cancelar.')),
      ) as never,
    )
    await screen.findByText('Profesional')

    await pulsa('cancelar-suscripcion')

    expect(await screen.findByText('No se ha podido cancelar.')).toBeTruthy()
  })

  /** Cancelada no es terminada: se sigue usando hasta el final del periodo ya pagado. */
  it('en una cancelada dice hasta cuándo sirve, y no ofrece cancelar de nuevo', async () => {
    await renderCatalog(
      <SubscriptionScreen />,
      contenedor(
        ok({
          subscription: { ...ACTIVA, cancelAt: '2026-10-01T00:00:00Z' },
          plans: [PLAN],
        }),
      ) as never,
    )

    expect(await screen.findByText(/Podrás seguir usándola hasta el/)).toBeTruthy()
    expect(screen.queryByTestId('cancelar-suscripcion')).toBeNull()
  })

  /**
   * Contratar NO se hace desde la app: vender una suscripción digital en iOS obliga a cobrarla con
   * el sistema de compras de Apple, y hacerlo con nuestra pasarela es motivo de rechazo.
   */
  it('lleva al escritorio para cambiar de plan', async () => {
    const abrir = jest.spyOn(Linking, 'openURL').mockResolvedValue(true)
    await renderCatalog(<SubscriptionScreen />, contenedor() as never)
    await screen.findByText('Profesional')

    await pulsa('ver-planes-en-la-web')

    expect(abrir).toHaveBeenCalledWith(expect.stringContaining('/planes'))
    abrir.mockRestore()
  })

  it('ofrece reintentar cuando no se puede cargar', async () => {
    const deps = contenedor(err(new AppError('NETWORK', 'sin conexión')))
    await renderCatalog(<SubscriptionScreen />, deps as never)

    expect(await screen.findByText('No se ha podido cargar tu suscripción.')).toBeTruthy()

    await act(async () => {
      fireEvent.press(screen.getByText('Reintentar'))
    })

    expect(deps.getSubscription.execute).toHaveBeenCalledTimes(2)
  })

  it('enseña el estado en crudo si el backend usa uno que la app no conoce', async () => {
    await renderCatalog(
      <SubscriptionScreen />,
      contenedor(
        ok({ subscription: { ...ACTIVA, status: 'PAUSED', billingPeriod: 'WEEKLY' }, plans: [PLAN] }),
      ) as never,
    )

    expect(await screen.findByText('PAUSED')).toBeTruthy()
    expect(screen.getByText('WEEKLY')).toBeTruthy()
  })
})
