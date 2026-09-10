import { ReactElement, ReactNode } from 'react'
import { Metrics, SafeAreaProvider } from 'react-native-safe-area-context'

/**
 * Medidas de un teléfono con muesca. Los valores dan igual mientras existan: lo que importa es que
 * haya un proveedor, porque `useSafeAreaInsets` lanza cuando no lo encuentra.
 */
const METRICS: Metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
}

/**
 * Envuelve una pantalla o una hoja con el área segura.
 *
 * En la aplicación el proveedor lo monta el layout raíz, así que todo lo que se pinta lo tiene; en
 * una prueba que monta el componente suelto no, y cualquier cosa que pregunte por los márgenes del
 * sistema —la hoja inferior, por ejemplo— revienta con «No safe area value available». Esto lo pone,
 * que es lo que documenta la propia librería para pruebas.
 */
export function withSafeArea(ui: ReactNode): ReactElement {
  return <SafeAreaProvider initialMetrics={METRICS}>{ui}</SafeAreaProvider>
}
