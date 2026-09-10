import { useColorScheme } from 'react-native'

import { dark, light, Palette } from './colors'

/**
 * Paleta activa según el tema del sistema.
 *
 * Las pantallas pintan con clases y no necesitan esto. Es para lo que exige un color literal: el
 * trazo de un icono, el color de un `ActivityIndicator`, las opciones del navegador. Sin el hook,
 * cada uno de esos sitios acabaría escribiendo el valor claro a fuego y quedándose ilegible en
 * oscuro —que es justo lo que pasaba antes de tener tema.
 */
export function useTheme(): Palette {
  return useColorScheme() === 'dark' ? dark : light
}
