import { ReactElement } from 'react'
import { Text as NativeText, TextProps } from 'react-native'

/**
 * Papel del texto dentro de la página. No es un tamaño: es para qué sirve la frase, y de ahí salen
 * el cuerpo, el interlineado y el peso. Quien escribe una pantalla elige el papel, nunca los píxeles.
 */
export type TextVariant =
  | 'display'
  | 'title'
  | 'heading'
  | 'body'
  | 'label'
  | 'caption'
  | 'eyebrow'
  | 'price'

/**
 * Intención del color del texto.
 *
 * Sin latón ni ámbar: son colores de relleno del tema y no llegan al contraste que necesita un texto
 * pequeño. El latón sigue marcando el dinero, pero como fondo o como icono, no como letra.
 */
export type TextTone = 'default' | 'muted' | 'primary' | 'inverse' | 'success' | 'error'

interface Props extends TextProps {
  variant?: TextVariant
  tone?: TextTone
  /**
   * Solo para COLOCAR el texto —márgenes, ancho, alineación, `flex-1`—, nunca para cambiarle el
   * cuerpo ni el color: el orden de la hoja generada decide quién gana y una clase de color aquí
   * puede quedarse sin efecto sin dar ningún aviso. Si hace falta otro color, es que falta un tono.
   */
  className?: string
}

/*
 * Roboto Light es la voz de la marca, así que el peso fino llega hasta los titulares grandes —a 32 y
 * 22 píxeles un trazo fino se lee como catálogo, no como cartel—.
 *
 * De 15 píxeles para abajo el trazo fino DEJA DE LEERSE bien en pantalla: los pies de las tarjetas y
 * las segundas líneas de las listas salían desvaídos. Por eso el cuerpo pequeño va en regular y los
 * rótulos, versales y cifras en medio. El Light se queda donde tiene sitio para lucir.
 */
const VARIANTS: Record<TextVariant, string> = {
  display: 'font-light text-display',
  title: 'font-light text-title',
  heading: 'font-medium text-heading',
  body: 'font-light text-body',
  label: 'font-medium text-label',
  caption: 'font-regular text-caption',
  eyebrow: 'font-medium text-eyebrow uppercase',
  price: 'font-medium text-price',
}

/*
 * Los colores son los del escaparate, sin inventar ninguno.
 *
 * El latón y el ámbar NO aparecen aquí: en el tema son «badges/acento premium», colores de RELLENO,
 * y sobre el fondo claro dan 3,08 y 2,47 de contraste —por debajo del 4,5 que necesita un texto
 * pequeño para leerse—. Como mancha de color siguen usándose: distintivos, estrellas, el fondo del
 * tramo de precio. Lo que va escrito encima, en tinta.
 */
const TONES: Record<TextTone, string> = {
  default: 'text-base-content',
  muted: 'text-muted',
  primary: 'text-primary',
  inverse: 'text-primary-content',
  success: 'text-success',
  error: 'text-error',
}

/**
 * El texto de la aplicación.
 *
 * Existe para que ninguna pantalla vuelva a escribir `text-[15px] leading-[21px]` a mano: el `Text`
 * de React Native no hereda ni familia ni color, así que cada uso suelto acababa saliendo con la
 * tipografía del sistema y con el negro por omisión —ilegible en cuanto el móvil está en oscuro—.
 */
export function Text({
  variant = 'body',
  tone = 'default',
  className = '',
  ...rest
}: Props): ReactElement {
  return <NativeText className={`${VARIANTS[variant]} ${TONES[tone]} ${className}`} {...rest} />
}
