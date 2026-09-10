/**
 * Paleta de la aplicación: el tema `nx036-pastel` del escaparate CON MÁS VIDA.
 *
 * <p>Mismo tono que la web —el cobalto sigue siendo cobalto y el latón, latón— y más saturación. Esa
 * paleta nació para pantallas de escritorio y en un móvil, rodeada de fotos de producto a todo color,
 * se leía apagada para una tienda. La luminosidad apenas se toca: es lo que mantiene el contraste,
 * porque aclarar dejaba el verde y el rojo por debajo del mínimo que necesita un texto pequeño.
 *
 * <p>Por eso la aplicación y el escritorio ya NO comparten los valores exactos. Es una decisión
 * tomada, no una deriva: si algún día se quieren alinear, son estos siete valores en `styles.css`.
 *
 * <p>¡OJO! Estas constantes son el ESPEJO de las variables de `global.css` y hay que cambiarlas A LA
 * VEZ. Ya pasó: al avivar la paleta se tocó solo el CSS y las estrellas de valoración se quedaron con
 * el latón antiguo mientras los enlaces ya iban con el nuevo. No da ningún error, solo deja dos tonos
 * del mismo color conviviendo en la misma pantalla.
 *
 * <p>Existen solo para las interfaces que exigen un color literal y no admiten clases: las opciones
 * del navegador, `ActivityIndicator`, el trazo de un icono, el formulario nativo de tarjeta. Todo lo
 * que pueda pintarse con `className` debe usar la clase, no estas constantes.
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
  /** Tinta media: texto auxiliar, marcadores de campo e iconos apagados. */
  muted: string
  info: string
  success: string
  successContent: string
  warning: string
  warningContent: string
  error: string
  errorContent: string
}

export const light: Palette = {
  primary: '#0050b2',
  primaryContent: '#eef4fc',
  secondary: '#0c3a56',
  secondaryContent: '#eaf1f6',
  accent: '#dc8c11',
  accentContent: '#211505',
  base100: '#fcfdfe',
  base200: '#f4f6f9',
  base300: '#e3e8ef',
  baseContent: '#14212e',
  muted: '#5c6e7c',
  info: '#1c77a5',
  success: '#0f7f5b',
  successContent: '#eef6f2',
  warning: '#f79d0d',
  warningContent: '#211505',
  error: '#cf3a18',
  errorContent: '#fbf0ec',
}

export const dark: Palette = {
  primary: '#2c92ff',
  primaryContent: '#03121f',
  secondary: '#1b5c8d',
  secondaryContent: '#eaf1f6',
  accent: '#efa225',
  accentContent: '#1e1305',
  base100: '#0e1a26',
  base200: '#142434',
  base300: '#1e3143',
  baseContent: '#e7eef3',
  muted: '#8fa3b1',
  info: '#3195c3',
  success: '#19a577',
  successContent: '#05140f',
  warning: '#fbae1f',
  warningContent: '#1e1305',
  error: '#e84824',
  errorContent: '#1f0a05',
}
