import { getDeviceId, loadDeviceId, resetDeviceIdForTests } from '../device-identity'

import { PreferenceStore } from '@core/storage/ports'

jest.mock('expo-crypto', () => ({
  randomUUID: (): string => '11111111-2222-3333-4444-555555555555',
}))

/** Almacén de mentira con lo justo: lo que se guarda es lo que se lee. */
function almacen(inicial: Record<string, string> = {}): PreferenceStore & { datos: Record<string, string> } {
  const datos = { ...inicial }
  return {
    datos,
    get: async (key) => datos[key] ?? null,
    set: async (key, value) => {
      datos[key] = value
    },
    remove: async (key) => {
      delete datos[key]
    },
  }
}

/**
 * El backend reconocía el teléfono por una cookie y un cliente nativo no las lleva: cada entrada
 * creaba una sesión nueva y ninguna salía marcada como la propia.
 */
describe('loadDeviceId', () => {
  beforeEach(() => resetDeviceIdForTests())

  it('emite un identificador y lo guarda la primera vez', async () => {
    const store = almacen()

    await loadDeviceId(store)

    expect(getDeviceId()).toBe('11111111222233334444555555555555')
    expect(store.datos['nx036.device.id']).toBe('11111111222233334444555555555555')
  })

  it('reutiliza el guardado: es lo que hace que sea SIEMPRE el mismo teléfono', async () => {
    const guardado = 'aabbccddeeff00112233445566778899'
    const store = almacen({ 'nx036.device.id': guardado })

    await loadDeviceId(store)

    expect(getDeviceId()).toBe(guardado)
  })

  /** Solo se acepta la forma que emite el backend; lo demás se descarta y se emite uno nuevo. */
  it('descarta un valor guardado con otra forma', async () => {
    const store = almacen({ 'nx036.device.id': 'esto-no-es-un-identificador' })

    await loadDeviceId(store)

    expect(getDeviceId()).toBe('11111111222233334444555555555555')
  })

  /** Sin identificador se sigue entrando: peor sería no dejar pasar. */
  it('no rompe el arranque si el almacén falla', async () => {
    const store: PreferenceStore = {
      get: async () => {
        throw new Error('almacén ilegible')
      },
      set: async () => undefined,
      remove: async () => undefined,
    }

    await expect(loadDeviceId(store)).resolves.toBeUndefined()
    expect(getDeviceId()).toBeNull()
  })
})
