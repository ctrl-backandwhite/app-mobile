import { PreferenceStore, SecretStore } from './ports'

/**
 * Doble para los tests: cumple ambos puertos sobre un Map.
 *
 * Cumplir los dos a la vez es deliberado: un test que ejercita credenciales y preferencias a la vez
 * necesita una sola instancia, y así no hay que declarar dos dobles casi idénticos.
 */
export class InMemoryStore implements SecretStore, PreferenceStore {
  private readonly data = new Map<string, string>()

  async get(key: string): Promise<string | null> {
    return this.data.get(key) ?? null
  }

  async set(key: string, value: string): Promise<void> {
    this.data.set(key, value)
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key)
  }
}
