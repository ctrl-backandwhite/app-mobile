/**
 * Paleta del tema daisyUI `nx036-pastel` copiada literalmente de `frontend/src/index.css`.
 *
 * Los valores no se reinterpretan ni se aproximan: la aplicación y el escritorio deben mostrar
 * exactamente el mismo cobalto, marino y latón, y cualquier retoque aquí abriría una deriva de
 * marca imposible de detectar en una revisión visual.
 */
export interface Palette {
  primary: string
  primaryContent: string
  secondary: string
  secondaryContent: string
  accent: string
  accentContent: string
  base100: string
  base200: string
  base300: string
  baseContent: string
  info: string
  success: string
  warning: string
  error: string
  errorContent: string
}

export const light: Palette = {
  primary: '#0c4a97',
  primaryContent: '#eef4fc',
  secondary: '#123246',
  secondaryContent: '#eaf1f6',
  accent: '#c0862d',
  accentContent: '#211505',
  base100: '#fcfdfe',
  base200: '#f4f6f9',
  base300: '#e3e8ef',
  baseContent: '#14212e',
  info: '#2e6e8e',
  success: '#1e6b52',
  warning: '#d9962b',
  error: '#b4472e',
  errorContent: '#fbf0ec',
}

export const dark: Palette = {
  primary: '#3f93ec',
  primaryContent: '#03121f',
  secondary: '#2a5a7e',
  secondaryContent: '#eaf1f6',
  accent: '#d39b41',
  accentContent: '#1e1305',
  base100: '#0e1a26',
  base200: '#142434',
  base300: '#1e3143',
  baseContent: '#e7eef3',
  info: '#4a8cab',
  success: '#2e9070',
  warning: '#e0a63a',
  error: '#d0573c',
  errorContent: '#1f0a05',
}

/** Tinta media del escritorio (`--color-ink-500`): el único gris del texto auxiliar y del marcador. */
export const placeholder = '#5c6e7c'
