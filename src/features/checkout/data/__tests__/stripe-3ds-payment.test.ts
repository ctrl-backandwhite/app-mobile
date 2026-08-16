import { handleNextAction } from '@stripe/stripe-react-native'

import { AppError } from '@core/errors/app-error'
import { FakePaymentMethodsRepository } from '@features/checkout/domain/testing/fake-payment-methods-repository'
import { PayWithSavedCard } from '@features/checkout/domain/usecases/pay-with-saved-card'

import { StripeCardAuthenticator } from '../repositories/stripe-card-authenticator'

const authenticate = handleNextAction as jest.MockedFunction<typeof handleNextAction>

/** Cobro que el banco devuelve con 3-D Secure pendiente, con su secreto y su identificador de pago. */
function requiresAction(confirmError?: AppError): FakePaymentMethodsRepository {
  return new FakePaymentMethodsRepository({
    charge: { status: 'requires_action', clientSecret: 'pi_1_secret', paymentId: 'pay-1' },
    confirmError,
  })
}

function payWithSavedCard(repository: FakePaymentMethodsRepository): PayWithSavedCard {
  return new PayWithSavedCard(repository, new StripeCardAuthenticator())
}

describe('Cobro con tarjeta guardada y 3-D Secure', () => {
  beforeEach(() => jest.clearAllMocks())

  it('autentica con el SDK y confirma contra el backend, en ese orden', async () => {
    authenticate.mockResolvedValue({ paymentIntent: { id: 'pi_1' } } as never)
    const repository = requiresAction()

    const result = await payWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(authenticate).toHaveBeenCalledWith('pi_1_secret')
    // La confirmación viaja con el pedido y el pago que devolvió el cobro, no con nada inventado.
    expect(repository.confirmations).toEqual([{ orderId: 'o-1', paymentId: 'pay-1' }])
    expect(result.ok && result.value.status).toBe('paid')
  })

  it('no da el pago por bueno solo porque el SDK diga que sí', async () => {
    // Quien decide si el dinero llegó es el servidor: si su confirmación falla, no hay cobro.
    authenticate.mockResolvedValue({ paymentIntent: { id: 'pi_1' } } as never)
    const repository = requiresAction(new AppError('SERVER', 'No se pudo confirmar'))

    const result = await payWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(!result.ok && result.error.code).toBe('SERVER')
  })

  it('no confirma nada si la persona cancela la autenticación', async () => {
    authenticate.mockResolvedValue({ error: { code: 'Canceled', message: 'Canceled' } } as never)
    const repository = requiresAction()

    const result = await payWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(repository.confirmations).toHaveLength(0)
    expect(!result.ok && result.error.code).toBe('CANCELLED')
  })

  it('no confirma nada si la autenticación falla', async () => {
    authenticate.mockResolvedValue({ error: { code: 'Failed', message: 'Authentication failed' } } as never)
    const repository = requiresAction()

    const result = await payWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(repository.confirmations).toHaveLength(0)
    expect(result.ok).toBe(false)
  })

  it('no abre el reto del banco cuando el cobro ya está cerrado', async () => {
    const repository = new FakePaymentMethodsRepository({ charge: { status: 'succeeded' } })

    const result = await payWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(authenticate).not.toHaveBeenCalled()
    expect(result.ok && result.value.status).toBe('paid')
  })
})
