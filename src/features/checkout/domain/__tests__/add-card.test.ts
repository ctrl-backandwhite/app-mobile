import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { acceptsCards, BillingConfig } from '../entities/billing-config'
import { BillingRepository } from '../ports/billing-repository'
import { CardSetupGateway } from '../ports/card-setup-gateway'
import { AddCard } from '../usecases/add-card'
import { GetBillingConfig } from '../usecases/get-billing-config'

const CONFIG: BillingConfig = { publishableKey: 'pk_test_del_backend', enabled: true }

function billing(overrides: Partial<BillingRepository> = {}): BillingRepository {
  return {
    config: jest.fn().mockResolvedValue(ok(CONFIG)),
    createSetupIntent: jest.fn().mockResolvedValue(ok('seti_1_secret_abc')),
    ...overrides,
  }
}

function gateway(outcome: unknown = ok(undefined)): CardSetupGateway {
  return { confirmSetup: jest.fn().mockResolvedValue(outcome) }
}

describe('GetBillingConfig', () => {
  it('devuelve la clave pública que sirve el backend', async () => {
    // La clave NO está escrita en la app: cambia por entorno y se pide en cada arranque.
    const result = await new GetBillingConfig(billing()).execute()

    expect(result.ok && result.value.publishableKey).toBe('pk_test_del_backend')
  })

  it('propaga el fallo del backend', async () => {
    const repository = billing({
      config: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'Sin conexión'))),
    })

    const result = await new GetBillingConfig(repository).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('acceptsCards', () => {
  it('solo acepta tarjetas con el cobro activo y con clave', () => {
    expect(acceptsCards(CONFIG)).toBe(true)
    expect(acceptsCards({ ...CONFIG, enabled: false })).toBe(false)
    expect(acceptsCards({ enabled: true })).toBe(false)
    expect(acceptsCards(undefined)).toBe(false)
  })
})

describe('AddCard', () => {
  it('pide el intento al backend y lo confirma con la pasarela', async () => {
    const repository = billing()
    const cards = gateway()

    const result = await new AddCard(repository, cards).execute('Ana Ruiz')

    expect(repository.createSetupIntent).toHaveBeenCalled()
    // El secreto del intento y el titular son lo único que sale de la app: el número de tarjeta lo
    // custodia el SDK y va directo a la pasarela.
    expect(cards.confirmSetup).toHaveBeenCalledWith('seti_1_secret_abc', 'Ana Ruiz')
    expect(result.ok).toBe(true)
  })

  it('recorta el nombre del titular antes de mandarlo', async () => {
    const cards = gateway()

    await new AddCard(billing(), cards).execute('  Ana Ruiz  ')

    expect(cards.confirmSetup).toHaveBeenCalledWith('seti_1_secret_abc', 'Ana Ruiz')
  })

  it('no abre ningún intento si falta el nombre del titular', async () => {
    // Abrirlo dejaría un intento colgando en la pasarela por un formulario a medio rellenar.
    const repository = billing()
    const cards = gateway()

    const result = await new AddCard(repository, cards).execute('   ')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(repository.createSetupIntent).not.toHaveBeenCalled()
    expect(cards.confirmSetup).not.toHaveBeenCalled()
  })

  it('no llama a la pasarela si el backend no abre el intento', async () => {
    const repository = billing({
      createSetupIntent: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'Vaya'))),
    })
    const cards = gateway()

    const result = await new AddCard(repository, cards).execute('Ana Ruiz')

    expect(!result.ok && result.error.code).toBe('SERVER')
    expect(cards.confirmSetup).not.toHaveBeenCalled()
  })

  it('propaga el rechazo de la pasarela en lugar de dar la tarjeta por guardada', async () => {
    const cards = gateway(err(new AppError('VALIDATION', 'Tu tarjeta ha sido rechazada.')))

    const result = await new AddCard(billing(), cards).execute('Ana Ruiz')

    expect(!result.ok && result.error.message).toBe('Tu tarjeta ha sido rechazada.')
  })
})
