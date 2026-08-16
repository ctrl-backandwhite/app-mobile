import { handleNextAction } from '@stripe/stripe-react-native'

import { StripeCardAuthenticator } from '../repositories/stripe-card-authenticator'

// El sustituto del SDK nativo lo instala `jest.setup.js`; aquí solo se decide qué responde.
const authenticate = handleNextAction as jest.MockedFunction<typeof handleNextAction>

describe('StripeCardAuthenticator', () => {
  beforeEach(() => jest.clearAllMocks())

  it('abre el reto del banco con el secreto del cobro', async () => {
    // Tras autenticar, el intento queda pendiente de confirmar: es el estado normal cuando quien
    // cierra el cobro es el servidor, y por eso aquí no se juzga el estado, solo el fallo.
    authenticate.mockResolvedValue({
      paymentIntent: { id: 'pi_1', status: 'RequiresConfirmation' },
    } as never)

    const result = await new StripeCardAuthenticator().authenticate('pi_1_secret')

    expect(authenticate).toHaveBeenCalledWith('pi_1_secret')
    expect(result.ok).toBe(true)
  })

  it('devuelve CANCELLED si la persona cierra el reto sin completarlo', async () => {
    authenticate.mockResolvedValue({ error: { code: 'Canceled', message: 'Canceled' } } as never)

    const result = await new StripeCardAuthenticator().authenticate('pi_1_secret')

    expect(!result.ok && result.error.code).toBe('CANCELLED')
  })

  it('devuelve el fallo de la autenticación con el mensaje del banco', async () => {
    authenticate.mockResolvedValue({
      error: { code: 'Failed', message: 'Authentication failed', localizedMessage: 'No se pudo autenticar' },
    } as never)

    const result = await new StripeCardAuthenticator().authenticate('pi_1_secret')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(!result.ok && result.error.message).toBe('No se pudo autenticar')
  })

  it('no da la autenticación por buena si el SDK revienta', async () => {
    authenticate.mockRejectedValue(new Error('módulo nativo caído'))

    const result = await new StripeCardAuthenticator().authenticate('pi_1_secret')

    expect(!result.ok && result.error.code).toBe('UNKNOWN')
  })

  it('cae al texto propio cuando la pasarela no manda mensaje', async () => {
    authenticate.mockResolvedValue({ error: { code: 'Unknown', message: '' } } as never)

    const result = await new StripeCardAuthenticator().authenticate('pi_1_secret')

    expect(!result.ok && result.error.message).toMatch(/autenticación de tu banco/)
  })
})
