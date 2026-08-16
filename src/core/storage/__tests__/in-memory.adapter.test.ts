import { InMemoryStore } from '../in-memory.adapter'
import { PreferenceStore, SecretStore } from '../ports'

describe('InMemoryStore', () => {
  it('devuelve null cuando la clave no existe', async () => {
    const store = new InMemoryStore()

    await expect(store.get('ausente')).resolves.toBeNull()
  })

  it('guarda y recupera un valor', async () => {
    const store = new InMemoryStore()

    await store.set('token', 'abc')

    await expect(store.get('token')).resolves.toBe('abc')
  })

  it('sobrescribe el valor de una clave existente', async () => {
    const store = new InMemoryStore()

    await store.set('divisa', 'EUR')
    await store.set('divisa', 'USD')

    await expect(store.get('divisa')).resolves.toBe('USD')
  })

  it('borra la clave y vuelve a devolver null', async () => {
    const store = new InMemoryStore()
    await store.set('token', 'abc')

    await store.remove('token')

    await expect(store.get('token')).resolves.toBeNull()
  })

  it('borrar una clave inexistente no falla', async () => {
    const store = new InMemoryStore()

    await expect(store.remove('ausente')).resolves.toBeUndefined()
  })

  it('mantiene las claves aisladas entre sí', async () => {
    const store = new InMemoryStore()

    await store.set('a', '1')
    await store.set('b', '2')
    await store.remove('a')

    await expect(store.get('a')).resolves.toBeNull()
    await expect(store.get('b')).resolves.toBe('2')
  })

  it('no comparte estado entre instancias', async () => {
    const primera = new InMemoryStore()
    const segunda = new InMemoryStore()

    await primera.set('token', 'abc')

    await expect(segunda.get('token')).resolves.toBeNull()
  })

  // El doble solo sirve si encaja en los dos puertos; si dejara de cumplir uno, el fallo aparecería
  // en cada test que lo use en vez de aquí.
  it('sirve como SecretStore y como PreferenceStore', async () => {
    const store = new InMemoryStore()
    const comoSecreto: SecretStore = store
    const comoPreferencia: PreferenceStore = store

    await comoSecreto.set('token', 'abc')
    await comoPreferencia.set('idioma', 'es')

    await expect(comoSecreto.get('token')).resolves.toBe('abc')
    await expect(comoPreferencia.get('idioma')).resolves.toBe('es')
  })
})
