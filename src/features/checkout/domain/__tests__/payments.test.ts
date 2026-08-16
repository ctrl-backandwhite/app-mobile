import { AppError } from '@core/errors/app-error'

import { aPaymentMethod, aWalletBalance } from '../testing/checkout-builders'
import { FakeCardAuthenticator } from '../testing/fake-card-authenticator'
import { FakePaymentMethodsRepository } from '../testing/fake-payment-methods-repository'
import { FakeWalletRepository } from '../testing/fake-wallet-repository'
import { GetWalletBalance } from '../usecases/get-wallet-balance'
import { ListPaymentMethods } from '../usecases/list-payment-methods'
import { PayWithSavedCard } from '../usecases/pay-with-saved-card'

describe('GetWalletBalance', () => {
  it('devuelve el saldo con el importe ya formateado por el backend', async () => {
    const repository = new FakeWalletRepository({
      balance: aWalletBalance({ balanceFormatted: '100,00 €' }),
    })

    const result = await new GetWalletBalance(repository).execute()

    expect(result.ok && result.value.balanceFormatted).toBe('100,00 €')
  })

  it('propaga el fallo del backend', async () => {
    const repository = new FakeWalletRepository({ error: new AppError('NETWORK', 'Sin conexión') })

    const result = await new GetWalletBalance(repository).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('ListPaymentMethods', () => {
  it('pone el predeterminado el primero para poder preseleccionarlo', async () => {
    const repository = new FakePaymentMethodsRepository({
      methods: [
        aPaymentMethod({ id: 'pm_1', isDefault: false }),
        aPaymentMethod({ id: 'pm_2', isDefault: true }),
      ],
    })

    const result = await new ListPaymentMethods(repository).execute()

    expect(result.ok && result.value.map((method) => method.id)).toEqual(['pm_2', 'pm_1'])
  })

  it('tolera que no haya ningún método guardado', async () => {
    const result = await new ListPaymentMethods(new FakePaymentMethodsRepository()).execute()

    expect(result.ok && result.value).toEqual([])
  })

  it('propaga el fallo del backend', async () => {
    const repository = new FakePaymentMethodsRepository({
      listError: new AppError('SERVER', 'Vaya'),
    })

    const result = await new ListPaymentMethods(repository).execute()

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})

describe('PayWithSavedCard', () => {
  it('cobra el pedido ya creado con la tarjeta elegida', async () => {
    const repository = new FakePaymentMethodsRepository({ charge: { status: 'succeeded' } })

    const result = await new PayWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(repository.charges).toEqual([{ orderId: 'o-1', methodId: 'pm_1' }])
    expect(result.ok && result.value.status).toBe('paid')
    // Sin autenticación de por medio no hay nada que confirmar: el cobro ya está cerrado.
    expect(repository.confirmations).toHaveLength(0)
  })

  it('deja el cobro pendiente cuando el banco pide autenticación y no hay quien la haga', async () => {
    // Es la situación de hoy: falta el SDK nativo de la pasarela. Mejor decirlo que fingir un cobro.
    const repository = new FakePaymentMethodsRepository({
      charge: { status: 'requires_action', clientSecret: 'cs_1', paymentId: 'pay-1' },
    })

    const result = await new PayWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(result.ok && result.value.status).toBe('needs-authentication')
    expect(repository.confirmations).toHaveLength(0)
  })

  it('confirma el cobro DESPUÉS de superar la autenticación, en ese orden', async () => {
    const repository = new FakePaymentMethodsRepository({
      charge: { status: 'requires_action', clientSecret: 'cs_1', paymentId: 'pay-1' },
    })
    const authenticator = new FakeCardAuthenticator()

    const result = await new PayWithSavedCard(repository, authenticator).execute('o-1', 'pm_1')

    expect(authenticator.secrets).toEqual(['cs_1'])
    expect(repository.confirmations).toEqual([{ orderId: 'o-1', paymentId: 'pay-1' }])
    expect(result.ok && result.value.status).toBe('paid')
  })

  it('no confirma nada si la autenticación falla', async () => {
    const repository = new FakePaymentMethodsRepository({
      charge: { status: 'requires_action', clientSecret: 'cs_1', paymentId: 'pay-1' },
    })
    const authenticator = new FakeCardAuthenticator(new AppError('CANCELLED', 'Autenticación cancelada'))

    const result = await new PayWithSavedCard(repository, authenticator).execute('o-1', 'pm_1')

    expect(repository.confirmations).toHaveLength(0)
    expect(!result.ok && result.error.code).toBe('CANCELLED')
  })

  it('falla como contrato si el servidor pide autenticar sin decir con qué', async () => {
    const repository = new FakePaymentMethodsRepository({ charge: { status: 'requires_action' } })

    const result = await new PayWithSavedCard(repository, new FakeCardAuthenticator()).execute(
      'o-1',
      'pm_1',
    )

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('falla como contrato si tras autenticar no hay pago que confirmar', async () => {
    const repository = new FakePaymentMethodsRepository({
      charge: { status: 'requires_action', clientSecret: 'cs_1' },
    })

    const result = await new PayWithSavedCard(repository, new FakeCardAuthenticator()).execute(
      'o-1',
      'pm_1',
    )

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })

  it('propaga el fallo del cobro sin tocar nada más', async () => {
    const repository = new FakePaymentMethodsRepository({
      chargeError: new AppError('VALIDATION', 'Tarjeta rechazada'),
    })

    const result = await new PayWithSavedCard(repository).execute('o-1', 'pm_1')

    expect(!result.ok && result.error.message).toBe('Tarjeta rechazada')
  })

  it('propaga el fallo de la confirmación', async () => {
    const repository = new FakePaymentMethodsRepository({
      charge: { status: 'requires_action', clientSecret: 'cs_1', paymentId: 'pay-1' },
      confirmError: new AppError('SERVER', 'No se pudo confirmar'),
    })

    const result = await new PayWithSavedCard(repository, new FakeCardAuthenticator()).execute(
      'o-1',
      'pm_1',
    )

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})
