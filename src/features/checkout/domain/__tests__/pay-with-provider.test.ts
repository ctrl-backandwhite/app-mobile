import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { PaymentApprovalGateway } from '../ports/payment-approval-gateway'
import { PaymentIntent, PaymentIntentRepository } from '../ports/payment-intent-repository'
import { PayWithProvider } from '../usecases/pay-with-provider'

const INTENT: PaymentIntent = {
  paymentId: 'pay-1',
  approvalUrl: 'https://paypal.test/approve/123',
  status: 'PENDING',
}

function payments(overrides: Partial<PaymentIntentRepository> = {}): PaymentIntentRepository {
  return {
    initiate: jest.fn().mockResolvedValue(ok(INTENT)),
    confirm: jest.fn().mockResolvedValue(ok({ ...INTENT, status: 'PAID' })),
    ...overrides,
  }
}

function approval(outcome: unknown): PaymentApprovalGateway {
  return { approve: jest.fn().mockResolvedValue(outcome) }
}

describe('PayWithProvider', () => {
  it('abre la página del proveedor y confirma contra el backend al volver', async () => {
    const repo = payments()
    const gateway = approval(ok('approved'))

    const result = await new PayWithProvider(repo, gateway).execute('o-1', 'PAYPAL')

    expect(result).toEqual({ ok: true, value: 'paid' })
    expect(gateway.approve).toHaveBeenCalledWith('https://paypal.test/approve/123')
    // La confirmación no se salta nunca: que el navegador vuelva con «aprobado» solo dice que la
    // persona pulsó el botón, no que el dinero haya llegado. Quien lo decide es el servidor.
    expect(repo.confirm).toHaveBeenCalledWith('o-1', 'pay-1')
  })

  it('no confirma nada si la persona cancela en la pasarela', async () => {
    const repo = payments()

    const result = await new PayWithProvider(repo, approval(ok('cancelled'))).execute('o-1', 'PAYPAL')

    expect(result).toEqual({ ok: true, value: 'cancelled' })
    expect(repo.confirm).not.toHaveBeenCalled()
  })

  it('falla con CONTRACT si la pasarela no devuelve página de aprobación', async () => {
    // Sin esa dirección no hay a dónde enviar a la persona: seguir dejaría un pedido creado y sin
    // cobrar, con la sensación de que ha pagado.
    const repo = payments({
      initiate: jest.fn().mockResolvedValue(ok({ paymentId: 'pay-1', status: 'PENDING' })),
    })
    const gateway = approval(ok('approved'))

    const result = await new PayWithProvider(repo, gateway).execute('o-1', 'PAYPAL')

    expect(!result.ok && result.error.code).toBe('CONTRACT')
    expect(gateway.approve).not.toHaveBeenCalled()
  })

  it('propaga el fallo al iniciar el cobro sin abrir el navegador', async () => {
    const repo = payments({
      initiate: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'la pasarela no responde'))),
    })
    const gateway = approval(ok('approved'))

    const result = await new PayWithProvider(repo, gateway).execute('o-1', 'PAYPAL')

    expect(!result.ok && result.error.code).toBe('SERVER')
    expect(gateway.approve).not.toHaveBeenCalled()
  })

  it('propaga el fallo de la confirmación en lugar de darlo por pagado', async () => {
    const repo = payments({
      confirm: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
    })

    const result = await new PayWithProvider(repo, approval(ok('approved'))).execute('o-1', 'PAYPAL')

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('propaga el fallo de la vista de aprobación', async () => {
    const repo = payments()
    const gateway = approval(err(new AppError('UNKNOWN', 'no se pudo abrir el navegador')))

    const result = await new PayWithProvider(repo, gateway).execute('o-1', 'PAYPAL')

    expect(result.ok).toBe(false)
    expect(repo.confirm).not.toHaveBeenCalled()
  })
})
