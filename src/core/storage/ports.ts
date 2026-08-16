/**
 * Puertos de almacenamiento. El dominio depende de estas interfaces y nunca del SDK concreto, así
 * que cambiar de almacén —o sustituirlo por un doble en los tests— no toca ni una línea del dominio.
 *
 * Los dos puertos tienen la misma forma pero NO se unifican a propósito: la firma es lo que obliga
 * a decidir dónde va cada dato. Un token en el almacén de preferencias sería una fuga de seguridad
 * silenciosa; con puertos separados, el tipo lo impide.
 */

/** Almacén cifrado del dispositivo (Keychain en iOS, Keystore en Android). Para credenciales. */
export interface SecretStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}

/** Almacén sin cifrar. Para preferencias: divisa, idioma, país. */
export interface PreferenceStore {
  get(key: string): Promise<string | null>
  set(key: string, value: string): Promise<void>
  remove(key: string): Promise<void>
}
