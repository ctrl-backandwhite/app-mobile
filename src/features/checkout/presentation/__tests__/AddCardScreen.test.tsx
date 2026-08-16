import { confirmSetupIntent } from '@stripe/stripe-react-native'
import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { ok } from '@core/result/result'
import { StripeCardSetupGateway } from '@features/checkout/data/repositories/stripe-card-setup.gateway'
import { BillingConfig } from '@features/checkout/domain/entities/billing-config'
import { BillingRepository } from '@features/checkout/domain/ports/billing-repository'
import { AddCard } from '@features/checkout/domain/usecases/add-card'

import { AddCardScreen } from '../screens/AddCardScreen'
import { makeQueryClient, renderCheckout } from '../testing/render-checkout'

const CONFIG: BillingConfig = { publishableKey: 'pk_test_del_backend', enabled: true }
const CARD_NUMBER = '4242424242424242'

const confirm = confirmSetupIntent as jest.MockedFunction<typeof confirmSetupIntent>

function billing(): BillingRepository {
  return {
    config: jest.fn().mockResolvedValue(ok(CONFIG)),
    createSetupIntent: jest.fn().mockResolvedValue(ok('seti_1_secret_abc')),
  }
}

/**
 * Contenedor con el caso de uso REAL sobre el SDK sustituido: es lo que hace que la prueba compruebe
 * de verdad que el alta pide el intento al backend y lo cierra con la pasarela, y no solo que la
 * pantalla llama a un doble.
 */
function deps(overrides: { billing?: BillingRepository; config?: BillingConfig } = {}) {
  const repository = overrides.billing ?? billing()
  return {
    repository,
    container: {
      getBillingConfig: {
        execute: jest.fn().mockResolvedValue(ok(overrides.config ?? CONFIG)),
      },
      addCard: new AddCard(repository, new StripeCardSetupGateway()),
    },
  }
}

/** Rellena el titular y teclea un número completo en el campo de tarjeta del SDK. */
async function fill(): Promise<void> {
  await fireEvent.changeText(await screen.findByLabelText('Nombre del titular'), 'Ana Ruiz')
  await fireEvent.changeText(screen.getByLabelText('Datos de la tarjeta'), CARD_NUMBER)
}

describe('AddCardScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    confirm.mockResolvedValue({ setupIntent: { id: 'seti_1' } } as never)
  })

  it('pide la clave pública al backend antes de enseñar el formulario', async () => {
    // La clave no está escrita en la app: cambia por entorno y no debe vivir en el repositorio.
    const { container } = deps()
    await renderCheckout(<AddCardScreen />, container)

    expect(await screen.findByLabelText('Datos de la tarjeta')).toBeTruthy()
    expect(container.getBillingConfig.execute).toHaveBeenCalled()
  })

  it('no enseña el formulario si el entorno no cobra con tarjeta', async () => {
    // Pintarlo llevaría a teclear una tarjeta entera para descubrir al guardar que no hay pasarela.
    const { container } = deps({ config: { enabled: false } })
    await renderCheckout(<AddCardScreen />, container)

    expect(await screen.findByText(/no está disponible/)).toBeTruthy()
    expect(screen.queryByLabelText('Datos de la tarjeta')).toBeNull()
  })

  it('abre el intento en el backend y lo confirma con el SDK', async () => {
    const { container, repository } = deps()
    const client = makeQueryClient()
    const invalidate = jest.spyOn(client, 'invalidateQueries')
    await renderCheckout(<AddCardScreen />, container, client)

    await fill()
    await fireEvent.press(screen.getByText('Guardar tarjeta'))

    await waitFor(() => expect(repository.createSetupIntent).toHaveBeenCalled())
    expect(confirm).toHaveBeenCalledWith('seti_1_secret_abc', {
      paymentMethodType: 'Card',
      paymentMethodData: { billingDetails: { name: 'Ana Ruiz' } },
    })
    // La compra lee los métodos con esta clave: invalidarla es lo que hace que la tarjeta recién
    // guardada aparezca ya elegible al volver.
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['payment-methods'] })
    expect(global.routerMock.back).toHaveBeenCalled()
  })

  it('enseña el rechazo de la pasarela y no guarda nada', async () => {
    confirm.mockResolvedValue({
      error: { code: 'Failed', message: 'Card declined', localizedMessage: 'Tarjeta rechazada' },
    } as never)
    const { container } = deps()
    const client = makeQueryClient()
    const invalidate = jest.spyOn(client, 'invalidateQueries')
    await renderCheckout(<AddCardScreen />, container, client)

    await fill()
    await fireEvent.press(screen.getByText('Guardar tarjeta'))

    expect(await screen.findByText('Tarjeta rechazada')).toBeTruthy()
    expect(invalidate).not.toHaveBeenCalled()
    expect(global.routerMock.back).not.toHaveBeenCalled()
  })

  it('no deja guardar sin el nombre del titular', async () => {
    const { container } = deps()
    await renderCheckout(<AddCardScreen />, container)

    await fireEvent.changeText(await screen.findByLabelText('Datos de la tarjeta'), CARD_NUMBER)
    await fireEvent.press(screen.getByText('Guardar tarjeta'))

    expect(confirm).not.toHaveBeenCalled()
  })

  it('no deja guardar con la tarjeta a medio teclear', async () => {
    const { container, repository } = deps()
    await renderCheckout(<AddCardScreen />, container)

    await fireEvent.changeText(await screen.findByLabelText('Nombre del titular'), 'Ana Ruiz')
    await fireEvent.changeText(screen.getByLabelText('Datos de la tarjeta'), '4242')
    await fireEvent.press(screen.getByText('Guardar tarjeta'))

    expect(repository.createSetupIntent).not.toHaveBeenCalled()
  })

  it('vuelve atrás al cancelar sin tocar la pasarela', async () => {
    const { container } = deps()
    await renderCheckout(<AddCardScreen />, container)

    await fireEvent.press(await screen.findByText('Cancelar'))

    expect(global.routerMock.back).toHaveBeenCalled()
    expect(confirm).not.toHaveBeenCalled()
  })
})
