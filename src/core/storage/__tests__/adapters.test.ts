import AsyncStorage from '@react-native-async-storage/async-storage'
import * as SecureStore from 'expo-secure-store'

import { AsyncPreferenceStore } from '../async-storage.adapter'
import { ExpoSecretStore } from '../secure-store.adapter'

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}))

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}))

const secure = SecureStore as jest.Mocked<typeof SecureStore>
const async = AsyncStorage as jest.Mocked<typeof AsyncStorage>

describe('ExpoSecretStore', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lee, escribe y borra del almacén cifrado', async () => {
    secure.getItemAsync.mockResolvedValue('valor')
    const store = new ExpoSecretStore()

    expect(await store.get('clave')).toBe('valor')
    await store.set('clave', 'nuevo')
    await store.remove('clave')

    expect(secure.setItemAsync).toHaveBeenCalledWith('clave', 'nuevo')
    expect(secure.deleteItemAsync).toHaveBeenCalledWith('clave')
  })

  it('trata un fallo de lectura como ausencia de valor', async () => {
    // El almacén cifrado puede fallar (dispositivo sin bloqueo, almacén corrupto). Que eso tumbe el
    // arranque sería peor que empezar sin sesión.
    secure.getItemAsync.mockRejectedValue(new Error('keystore no disponible'))

    expect(await new ExpoSecretStore().get('clave')).toBeNull()
  })

  it('no propaga un fallo al escribir ni al borrar', async () => {
    secure.setItemAsync.mockRejectedValue(new Error('sin espacio'))
    secure.deleteItemAsync.mockRejectedValue(new Error('sin espacio'))
    const store = new ExpoSecretStore()

    await expect(store.set('clave', 'valor')).resolves.toBeUndefined()
    await expect(store.remove('clave')).resolves.toBeUndefined()
  })
})

describe('AsyncPreferenceStore', () => {
  beforeEach(() => jest.clearAllMocks())

  it('lee, escribe y borra preferencias', async () => {
    async.getItem.mockResolvedValue('EUR')
    const store = new AsyncPreferenceStore()

    expect(await store.get('divisa')).toBe('EUR')
    await store.set('divisa', 'USD')
    await store.remove('divisa')

    expect(async.setItem).toHaveBeenCalledWith('divisa', 'USD')
    expect(async.removeItem).toHaveBeenCalledWith('divisa')
  })

  it('degrada a nulo si el almacén de preferencias falla', async () => {
    async.getItem.mockRejectedValue(new Error('roto'))
    async.setItem.mockRejectedValue(new Error('roto'))
    async.removeItem.mockRejectedValue(new Error('roto'))
    const store = new AsyncPreferenceStore()

    expect(await store.get('divisa')).toBeNull()
    await expect(store.set('divisa', 'USD')).resolves.toBeUndefined()
    await expect(store.remove('divisa')).resolves.toBeUndefined()
  })
})
