import { ReactElement, useCallback, useEffect, useRef, useState } from 'react'
import {
  Animated,
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native'

import { ProductImage } from '@features/catalog/domain/entities/product-detail'

/**
 * Foto de la galería.
 *
 * Se recorta la entidad a lo que la galería pinta: así sirve igual a las fotos de la ficha que a una
 * lista armada a mano —la de una variante, por ejemplo— sin arrastrar `position` ni `role`.
 */
export type GalleryImage = Pick<ProductImage, 'id' | 'url'>

interface Props {
  images: readonly GalleryImage[]
  videoUrl?: string
  onIndexChange?: (index: number) => void
}

/** Máximo de fotos que recorre el pase: con galerías de treinta imágenes el recorrido sería eterno. */
const AUTOPLAY_MAX_IMAGES = 8
/** Tiempo entre foto y foto del pase automático. */
const AUTOPLAY_STEP_MS = 1200
/** El fundido dura menos que el paso para que la foto llegue a verse nítida antes del siguiente cambio. */
const FADE_MS = 400

interface Frame {
  readonly index: number
  readonly previous: number
}

export function ProductGallery({ images, videoUrl, onIndexChange }: Props): ReactElement | null {
  const { width } = useWindowDimensions()
  const [frame, setFrame] = useState<Frame>({ index: 0, previous: 0 })
  const [autoplaying, setAutoplaying] = useState(true)
  // El valor animado se guarda en estado con inicializador perezoso, no en una referencia: leer
  // `ref.current` durante el render está prohibido y `useState` da la misma instancia estable.
  const [fade] = useState<Animated.Value>((): Animated.Value => new Animated.Value(1))
  const surface = useRef<ScrollView | null>(null)
  const notify = useRef<((index: number) => void) | undefined>(undefined)

  const goTo = useCallback((next: number): void => {
    setFrame((current: Frame): Frame =>
      current.index === next ? current : { index: next, previous: current.index },
    )
  }, [])

  /** Detiene el pase para SIEMPRE: quien está mirando una foto manda sobre la animación. */
  const stopAutoplay = useCallback((): void => {
    setAutoplaying(false)
  }, [])

  // El aviso al padre va por referencia: si dependiera de la propia función, un padre que pase una
  // lambda en línea la recrearía en cada render y el efecto avisaría sin que cambiara la foto.
  useEffect((): void => {
    notify.current = onIndexChange
  }, [onIndexChange])

  useEffect((): void => {
    notify.current?.(frame.index)
  }, [frame.index])

  useEffect(() => {
    fade.setValue(0)
    const animation = Animated.timing(fade, {
      toValue: 1,
      duration: FADE_MS,
      useNativeDriver: true,
    })
    animation.start()
    return (): void => animation.stop()
  }, [fade, frame.index])

  useEffect(() => {
    const steps = Math.min(images.length, AUTOPLAY_MAX_IMAGES)
    if (!autoplaying || steps <= 1) {
      return undefined
    }
    // Empieza en 1 porque la foto 0 ya está a la vista al abrir la ficha.
    let step = 1
    const timer = setInterval((): void => {
      if (step >= steps) {
        // Fin del recorrido: vuelve a la primera y se queda ahí.
        goTo(0)
        setAutoplaying(false)
        return
      }
      goTo(step)
      step += 1
    }, AUTOPLAY_STEP_MS)
    return (): void => clearInterval(timer)
  }, [autoplaying, goTo, images.length])

  // Mientras manda el pase, la superficie de gesto se coloca en la misma página que la foto: así, al
  // tocar, el dedo arrastra desde donde el usuario está viendo y no desde la primera foto.
  useEffect((): void => {
    if (autoplaying) {
      surface.current?.scrollTo({ x: frame.index * width, animated: false })
    }
  }, [autoplaying, frame.index, width])

  const handleSwipeEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>): void => {
      if (width <= 0) {
        return
      }
      const page = Math.round(event.nativeEvent.contentOffset.x / width)
      goTo(Math.min(Math.max(page, 0), Math.max(images.length - 1, 0)))
    },
    [goTo, images.length, width],
  )

  // TODOS los hooks quedan declarados ARRIBA. Un `return null` por galería vacía colocado antes de
  // cualquiera de ellos deja a React con menos hooks de los que registró en el render anterior
  // —error #310, «rendered fewer hooks than expected»— y tumba la pantalla entera.
  const [first] = images
  if (!first) {
    return null
  }

  // El índice se recorta a la lista: si la galería se acorta con el pase en marcha, quedarse en un
  // hueco vacío dejaría la ficha sin foto en vez de volver a la primera.
  const current = images[Math.min(frame.index, images.length - 1)] ?? first
  const behind = images[Math.min(frame.previous, images.length - 1)] ?? first

  return (
    <View
      testID="product-gallery"
      onTouchStart={stopAutoplay}
      className="aspect-square w-full bg-base-100"
    >
      <Image
        accessibilityIgnoresInvertColors
        source={{ uri: behind.url }}
        resizeMode="contain"
        className="absolute inset-0 h-full w-full"
      />

      {/* La capa de arriba lleva fondo OPACO a propósito: con `contain` la foto no cubre todo el
          hueco y, si esta capa fuese transparente, por los márgenes se vería la foto anterior. */}
      <Animated.View style={{ opacity: fade }} className="absolute inset-0 bg-base-100">
        <Image
          testID="product-gallery-photo"
          accessibilityIgnoresInvertColors
          source={{ uri: current.url }}
          resizeMode="contain"
          className="h-full w-full"
        />
      </Animated.View>

      {videoUrl && frame.index === 0 ? (
        <View
          testID="product-gallery-video-badge"
          accessibilityRole="text"
          accessibilityLabel="Este producto tiene vídeo"
          className="absolute left-3 top-3 flex-row items-center gap-1.5 rounded-selector bg-secondary px-2 py-1"
        >
          {/* Triángulo de reproducción: un bloque sin tamaño al que solo se le pinta el borde izquierdo. */}
          <View className="h-0 w-0 border-b-[4px] border-l-[7px] border-t-[4px] border-b-transparent border-l-secondary-content border-t-transparent" />
          <Text className="text-[11px] text-secondary-content">Vídeo</Text>
        </View>
      ) : null}

      {/* Superficie de gesto: páginas vacías del ancho de la pantalla sobre el fundido. Separar el
          gesto del dibujo permite deslizar como en cualquier carrusel sin renunciar al cruce de
          capas, que un `ScrollView` con las fotos dentro no puede hacer. */}
      <ScrollView
        ref={surface}
        testID="product-gallery-surface"
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={stopAutoplay}
        onMomentumScrollEnd={handleSwipeEnd}
        className="absolute inset-0"
      >
        {images.map(
          (image: GalleryImage): ReactElement => <View key={image.id} style={{ width }} />,
        )}
      </ScrollView>

      {images.length > 1 ? (
        <View className="absolute inset-x-0 bottom-3 flex-row items-center justify-center gap-1.5">
          {images.map((image: GalleryImage, position: number): ReactElement => {
            const selected = position === frame.index

            return (
              <Pressable
                key={image.id}
                accessibilityRole="button"
                accessibilityLabel={`Foto ${position + 1} de ${images.length}`}
                accessibilityState={{ selected }}
                hitSlop={8}
                onPress={(): void => {
                  stopAutoplay()
                  goTo(position)
                }}
                className={`h-1.5 rounded-full ${selected ? 'w-4 bg-primary' : 'w-1.5 bg-base-300'}`}
              />
            )
          })}
        </View>
      ) : null}
    </View>
  )
}
