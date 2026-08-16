import { confirmSetupIntent } from '@stripe/stripe-react-native'

import { StripeCardSetupGateway } from '../repositories/stripe-card-setup.gateway'

// El sustituto del SDK nativo lo instala `jest.setup.js`; aquí solo se decide qué responde.
const confirm = confirmSetupIntent as jest.MockedFunction<typeof confirmSetupIntent>

describe('StripeCardSetupGateway', () => {
  beforeEach(() => jest.clearAllMocks())

  it('confirma el intento con el titular y sin tocar el número de tarjeta', async () => {
    confirm.mockResolvedValue({ setupIntent: { id: 'seti_1' } } as never)

    const result = await new StripeCardSetupGateway().confirmSetup('seti_1_secret', 'Ana Ruiz')

    // El número no aparece en la llamada: lo custodia el formulario del SDK y va directo a la
    // pasarela, que es lo que mantiene a la aplicación fuera del alcance de PCI-DSS.
    expect(confirm).toHaveBeenCalledWith('seti_1_secret', {
      paymentMethodType: 'Card',
      paymentMethodData: { billingDetails: { name: 'Ana Ruiz' } },
    })
    expect(result.ok).toBe(true)
  })

  it('devuelve el rechazo de la pasarela con su mensaje traducido', async () => {
    confirm.mockResolvedValue({
      error: { code: 'Failed', message: 'Card declined', localizedMessage: 'Tarjeta rechazada' },
    } as never)

    const result = await new StripeCardSetupGateway().confirmSetup('seti_1_secret', 'Ana Ruiz')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(!result.ok && result.error.message).toBe('Tarjeta rechazada')
  })

  it('distingue la cancelación de un rechazo', async () => {
    confirm.mockResolvedValue({ error: { code: 'Canceled', message: 'Canceled' } } as never)

    const result = await new StripeCardSetupGateway().confirmSetup('seti_1_secret', 'Ana Ruiz')

    expect(!result.ok && result.error.code).toBe('CANCELLED')
  })

  it('no da la tarjeta por guardada si el SDK revienta', async () => {
    confirm.mockRejectedValue(new Error('módulo nativo caído'))

    const result = await new StripeCardSetupGateway().confirmSetup('seti_1_secret', 'Ana Ruiz')

    expect(!result.ok && result.error.code).toBe('UNKNOWN')
  })
})
