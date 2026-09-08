/** Un idioma con diccionario publicado en la tienda. */
export interface Language {
  readonly code: string
  readonly label: string
  readonly flag: string
}

/** Una divisa activa, con lo justo para elegirla y para escribir un importe. */
export interface Currency {
  readonly code: string
  readonly name: string
  readonly symbol: string
  readonly flag: string
}
