import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { RegionRepository } from '../ports/region-repository'
import { ListCurrencies, ListLanguages } from '../usecases/list-region-options'

function repositorio(overrides: Partial<RegionRepository> = {}): RegionRepository {
  return {
    languages: jest.fn().mockResolvedValue(ok([])),
    currencies: jest.fn().mockResolvedValue(ok([])),
    ...overrides,
  }
}

describe('ListLanguages', () => {
  it('devuelve los idiomas publicados', async () => {
    const idiomas = [{ code: 'es', label: 'Español', flag: '🇪🇸' }]

    const result = await new ListLanguages(
      repositorio({ languages: jest.fn().mockResolvedValue(ok(idiomas)) }),
    ).execute()

    expect(result.ok && result.value).toEqual(idiomas)
  })

  it('propaga el fallo sin inventarse una lista vacía', async () => {
    const result = await new ListLanguages(
      repositorio({
        languages: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin conexión'))),
      }),
    ).execute()

    // Una lista vacía se leería como «no hay idiomas» y escondería que la petición ha fallado.
    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('ListCurrencies', () => {
  it('devuelve las divisas activas', async () => {
    const divisas = [{ code: 'EUR', name: 'Euro', symbol: '€', flag: '🇪🇺' }]

    const result = await new ListCurrencies(
      repositorio({ currencies: jest.fn().mockResolvedValue(ok(divisas)) }),
    ).execute()

    expect(result.ok && result.value).toEqual(divisas)
  })

  it('propaga el fallo', async () => {
    const result = await new ListCurrencies(
      repositorio({
        currencies: jest.fn().mockResolvedValue(err(new AppError('SERVER', 'caído'))),
      }),
    ).execute()

    expect(!result.ok && result.error.code).toBe('SERVER')
  })
})
