import { PreferenceStore } from '@core/storage/ports'

const CLAVE_IDIOMA = 'nx036.locale'
const CLAVE_DIVISA = 'nx036.currency'

export interface Preferences {
  readonly locale: string | null
  readonly currency: string | null
}

/**
 * El idioma y la divisa elegidos, guardados entre arranques.
 *
 * <p>Hasta ahora vivían solo en memoria: quien ponía la tienda en euros la encontraba en dólares al
 * volver a abrir la aplicación. Y no es un detalle estético — de la divisa salen los importes que se
 * leen antes de comprar.
 *
 * <p>Van al almacén SIN CIFRAR, que es donde les corresponde: no son credenciales, y meterlas en el
 * Keychain pagaría el coste de una lectura cifrada en cada arranque para proteger que alguien
 * prefiere el francés. El puerto separado es lo que hace evidente esa decisión.
 */
export class LoadPreferences {
  constructor(private readonly store: PreferenceStore) {}

  async execute(): Promise<Preferences> {
    const [locale, currency] = await Promise.all([
      this.store.get(CLAVE_IDIOMA),
      this.store.get(CLAVE_DIVISA),
    ])
    return { locale, currency }
  }
}

export class SavePreferences {
  constructor(private readonly store: PreferenceStore) {}

  async execute(preferences: Partial<Preferences>): Promise<void> {
    const tareas: Promise<void>[] = []
    if (preferences.locale) tareas.push(this.store.set(CLAVE_IDIOMA, preferences.locale))
    if (preferences.currency) tareas.push(this.store.set(CLAVE_DIVISA, preferences.currency))
    await Promise.all(tareas)
  }
}
