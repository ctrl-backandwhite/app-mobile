/**
 * Familias tipográficas registradas en `app/_layout.tsx`.
 *
 * La ESCALA (tamaños, interlineado, interletrado) no vive aquí sino en `tailwind.config.js`, para
 * que haya un único sitio donde se decide cuánto mide un título. Estas constantes son solo para las
 * interfaces que piden una familia literal y no admiten clases: las opciones del navegador y los
 * estilos nativos del formulario de tarjeta.
 *
 * Los nombres son las claves con las que `useFonts` registra las fuentes; cambiar uno aquí sin
 * cambiarlo allí deja el texto con la tipografía del sistema sin avisar.
 */
export interface FontFamily {
  light: string
  regular: string
  medium: string
  bold: string
}

export const fontFamily: FontFamily = {
  light: 'Roboto_300Light',
  regular: 'Roboto_400Regular',
  medium: 'Roboto_500Medium',
  bold: 'Roboto_700Bold',
}
