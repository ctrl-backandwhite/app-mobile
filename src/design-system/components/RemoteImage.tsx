import { Image, ImageContentFit } from 'expo-image'
import { cssInterop } from 'nativewind'
import { ReactElement } from 'react'

/*
 * NativeWind solo entiende de `className` en los componentes de React Native: a los de fuera hay que
 * presentárselos. Sin esto, `expo-image` recibía la clase y la IGNORABA, así que la foto se quedaba
 * sin tamaño y no se pintaba nada —ni error, ni hueco, ni aviso—.
 */
cssInterop(Image, { className: 'style' })

interface Props {
  /** Dirección de la foto. Sin ella se pinta el hueco, que es lo que corresponde. */
  uri?: string
  /**
   * Clases de tamaño y forma, SIEMPRE con alto y ancho ciertos: `h-16 w-16`, `h-full w-full`.
   *
   * Nada de proporciones (`aspect-square`): `expo-image` no las resuelve y se queda con altura cero,
   * así que la foto desaparece sin dar ningún error. Para una caja proporcionada, la proporción va en
   * la vista que la envuelve y aquí solo `h-full w-full`.
   */
  className?: string
  /** `cover` recorta para llenar; `contain` enseña la foto entera. */
  contentFit?: ImageContentFit
  /** Descripción para quien no ve la imagen. Sin ella, se oculta del árbol accesible. */
  accessibilityLabel?: string
  /** Milisegundos del fundido de entrada. A cero para quien ya anima el cambio por su cuenta. */
  transition?: number
  testID?: string
}

/**
 * Foto de producto servida por el catálogo.
 *
 * <p>Usa `expo-image` y no el `Image` de React Native por tres motivos que se notan en una rejilla:
 * guarda en disco lo ya descargado —al volver a la lista las fotos aparecen al instante en vez de
 * pedirse otra vez—, **reintenta** cuando una descarga falla, y aparece con un fundido en lugar de
 * saltar de golpe.
 *
 * <p>Lo del reintento es lo importante: la portada pide más de treinta fotos a la vez y alguna se
 * queda por el camino. Con el componente de serie ese hueco gris se quedaba para siempre y parecía
 * un producto sin foto; en realidad la foto estaba y nadie volvía a pedirla.
 */
export function RemoteImage({
  uri,
  className = '',
  contentFit = 'cover',
  accessibilityLabel,
  transition = 180,
  testID,
}: Props): ReactElement {
  return (
    <Image
      testID={testID}
      source={uri}
      contentFit={contentFit}
      // Guardado en memoria y en disco: es lo que hace que volver atrás no vuelva a descargar.
      cachePolicy="memory-disk"
      transition={transition}
      accessible={Boolean(accessibilityLabel)}
      accessibilityLabel={accessibilityLabel}
      accessibilityIgnoresInvertColors
      className={className}
    />
  )
}
