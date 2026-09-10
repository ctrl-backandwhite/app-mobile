import { ReactElement } from 'react'
import { View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

import { useTheme } from '../tokens/use-theme'
import { Text } from './Text'

/*
 * El símbolo de la marca: el mismo `circle-nodes` que la cabecera del escaparate y el icono de la
 * pestaña, con su trazado copiado literalmente de `front-nx036/public/favicon.svg`. Se dibuja en
 * lugar de cargarse como imagen para que herede el color del tema —en oscuro el cobalto sube a
 * #3f93ec— y para que no dependa de una descarga que puede no llegar.
 */
const CIRCLE_NODES =
  'M418.4 157.9c35.3-8.3 61.6-40 61.6-77.9c0-44.2-35.8-80-80-80c-43.4 0-78.7 34.5-80 77.5L136.2 ' +
  '151.1C121.7 136.8 101.9 128 80 128c-44.2 0-80 35.8-80 80s35.8 80 80 80c12.2 0 23.8-2.7 34.1-7.6' +
  'L259.7 407.8c-2.4 7.6-3.7 15.8-3.7 24.2c0 44.2 35.8 80 80 80s80-35.8 80-80c0-27.7-14-52.1-35.4-' +
  '66.4l37.8-207.7zM156.3 232.2c2.2-6.9 3.5-14.2 3.7-21.7l183.8-73.5c3.6 3.5 7.4 6.7 11.6 9.5L317.6 ' +
  '354.1c-5.5 1.3-10.8 3.1-15.8 5.5L156.3 232.2z'

interface Props {
  /** Alto del símbolo en píxeles. El rótulo acompaña en proporción. */
  size?: number
  /** Sobre fondo de marca el símbolo y el rótulo van en claro. */
  inverse?: boolean
  /** Solo el símbolo, sin el rótulo: para cabeceras estrechas. */
  symbolOnly?: boolean
}

/** El logotipo: símbolo más «NX036», la marca tal como se escribe en toda la plataforma. */
export function BrandMark({ size = 28, inverse = false, symbolOnly = false }: Props): ReactElement {
  const palette = useTheme()
  const tint = inverse ? palette.primaryContent : palette.primary

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="NX036"
      className="flex-row items-center gap-2"
    >
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Path d={CIRCLE_NODES} fill={tint} />
      </Svg>
      {symbolOnly ? null : (
        <Text
          variant="title"
          tone={inverse ? 'inverse' : 'default'}
          style={{ fontSize: size * 0.82, lineHeight: size * 1.02 }}
        >
          NX036
        </Text>
      )}
    </View>
  )
}
