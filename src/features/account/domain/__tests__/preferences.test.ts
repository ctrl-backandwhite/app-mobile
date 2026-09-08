import { PreferenceStore } from '@core/storage/ports'

import { LoadPreferences, SavePreferences } from '../usecases/preferences'

function almacen(inicial: Record<string, string> = {}): PreferenceStore & { datos: Record<string, string> } {
  const datos = { ...inicial }
  return {
    datos,
    get: jest.fn(async (key: string) => datos[key] ?? null),
    set: jest.fn(async (key: string, value: string) => {
      datos[key] = value
    }),
    remove: jest.fn(async (key: string) => {
      delete datos[key]
    }),
  }
}

describe('LoadPreferences', () => {
  it('lee el idioma y la divisa guardados', async () => {
    const store = almacen({ 'nx036.locale': 'fr', 'nx036.currency': 'EUR' })

    const preferencias = await new LoadPreferences(store).execute()

    expect(preferencias).toEqual({ locale: 'fr', currency: 'EUR' })
  })

  it('devuelve nulos en una instalación recién hecha', async () => {
    const preferencias = await new LoadPreferences(almacen()).execute()

    expect(preferencias).toEqual({ locale: null, currency: null })
  })
})

describe('SavePreferences', () => {
  it('guarda las dos', async () => {
    const store = almacen()

    await new SavePreferences(store).execute({ locale: 'de', currency: 'USD' })

    expect(store.datos).toEqual({ 'nx036.locale': 'de', 'nx036.currency': 'USD' })
  })

  /**
   * La pantalla de región cambia una cosa cada vez. Escribir la otra con lo que llegue —undefined—
   * borraría una elección que nadie ha tocado.
   */
  it('guarda solo lo que se le pasa', async () => {
    const store = almacen({ 'nx036.currency': 'EUR' })

    await new SavePreferences(store).execute({ locale: 'it' })

    expect(store.datos).toEqual({ 'nx036.locale': 'it', 'nx036.currency': 'EUR' })
    expect(store.set).toHaveBeenCalledTimes(1)
  })

  it('guarda solo la divisa cuando es lo único que cambia', async () => {
    const store = almacen({ 'nx036.locale': 'it' })

    await new SavePreferences(store).execute({ currency: 'GBP' })

    expect(store.datos).toEqual({ 'nx036.locale': 'it', 'nx036.currency': 'GBP' })
  })

  it('no escribe nada si no se le pasa ninguna', async () => {
    const store = almacen()

    await new SavePreferences(store).execute({})

    expect(store.set).not.toHaveBeenCalled()
  })
})
