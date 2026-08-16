/**
 * Tipografía del escritorio llevada a nativo: Roboto en cuatro pesos, cuerpo a 15 px —el
 * `html { font-size: 15px }` del web— y títulos apretados a -0.018em como en `index.css`.
 */
export interface FontFamily {
  light: string
  regular: string
  medium: string
  bold: string
}

/**
 * Los nombres son las claves con las que `useFonts` registra las fuentes en `app/_layout.tsx`;
 * cambiar uno aquí sin cambiarlo allí deja el texto con la tipografía del sistema sin avisar.
 */
export const fontFamily: FontFamily = {
  light: 'Roboto_300Light',
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
}

export interface FontSize {
  caption: number
  small: number
  label: number
  base: number
  title: number
  display: number
}

export const fontSize: FontSize = {
  caption: 11,
  small: 12,
  label: 13,
  base: 15,
  title: 18,
  display: 24,
}

export interface Tracking {
  title: number
  body: number
}

/** Interletrado en `em`, tal como lo declara el web. */
export const trackingEm: Tracking = {
  title: -0.018,
  body: -0.005,
}

/**
 * React Native mide el interletrado en puntos, no en `em`, así que el factor del web se convierte
 * en función del tamaño de letra en el punto de uso.
 */
export function letterSpacingOf(size: number, em: number = trackingEm.title): number {
  return Math.round(size * em * 100) / 100
}
