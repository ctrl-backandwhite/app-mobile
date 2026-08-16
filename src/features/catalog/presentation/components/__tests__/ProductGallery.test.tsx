import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Dimensions } from 'react-native'

import { ProductGallery } from '../ProductGallery'
import { someImages } from '../testing/detail-fixture'

// La primera prueba del fichero paga la compilación del módulo, y con la instrumentación de
// cobertura encima se pasa del límite de 5 s por defecto sin que nada vaya mal.
jest.setTimeout(20000)

const { width } = Dimensions.get('window')

// El pase automático vive de temporizadores: sin relojes falsos la prueba tendría que esperar de
// verdad 1,2 s por foto.
describe('ProductGallery', () => {
  beforeEach(() => {
    // `queueMicrotask` y `setImmediate` quedan fuera del reloj falso a propósito: son las vías por
    // las que `act` de React vacía su cola, y congelarlas deja el `render` esperando para siempre.
    jest.useFakeTimers({ doNotFake: ['queueMicrotask', 'setImmediate', 'clearImmediate'] })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.useRealTimers()
  })

  async function tick(ms: number): Promise<void> {
    await act(async () => {
      jest.advanceTimersByTime(ms)
    })
  }

  it('avanza sola de foto cada 1,2 segundos', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(4)} onIndexChange={onIndexChange} />)
    onIndexChange.mockClear()

    await tick(1200)
    expect(onIndexChange).toHaveBeenLastCalledWith(1)

    await tick(1200)
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('deja de avanzar PARA SIEMPRE en cuanto se toca la galería', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(6)} onIndexChange={onIndexChange} />)

    await tick(1200)
    expect(onIndexChange).toHaveBeenLastCalledWith(1)

    await fireEvent(screen.getByTestId('product-gallery'), 'touchStart')
    onIndexChange.mockClear()

    await tick(12000)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('deja de avanzar también cuando se desliza', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(6)} onIndexChange={onIndexChange} />)

    await fireEvent(screen.getByTestId('product-gallery-surface'), 'scrollBeginDrag')
    onIndexChange.mockClear()

    await tick(12000)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('recorre como mucho ocho fotos y se queda en la primera', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(20)} onIndexChange={onIndexChange} />)
    onIndexChange.mockClear()

    // Los saltos se dan de uno en uno: avanzando el reloj de golpe React agruparía los ocho
    // cambios de estado en un solo render y la prueba no vería el recorrido, solo su resultado.
    for (let step = 0; step < 7; step += 1) {
      await tick(1200)
    }
    expect(onIndexChange).toHaveBeenLastCalledWith(7)

    // Octavo paso: vuelve a la primera y se apaga, aunque queden doce fotos por detrás.
    await tick(1200)
    expect(onIndexChange).toHaveBeenLastCalledWith(0)

    const visited: number[] = onIndexChange.mock.calls.map(([index]: [number]): number => index)
    expect(Math.max(...visited)).toBe(7)

    onIndexChange.mockClear()
    await tick(12000)
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('con una sola imagen no revienta, no arranca el pase y no pinta puntos', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(1)} onIndexChange={onIndexChange} />)
    onIndexChange.mockClear()

    await tick(6000)

    // La foto viaja dentro de la capa del fundido, cuya opacidad arranca en 0: para la biblioteca
    // eso es un elemento oculto a accesibilidad y sin esta opción no lo encontraría.
    expect(
      screen.getByTestId('product-gallery-photo', { includeHiddenElements: true }),
    ).toBeOnTheScreen()
    expect(screen.queryByLabelText('Foto 1 de 1')).toBeNull()
    expect(onIndexChange).not.toHaveBeenCalled()
  })

  it('con la lista vacía no pinta nada y no revienta al avanzar el reloj', async () => {
    await render(<ProductGallery images={[]} />)

    await tick(6000)

    expect(screen.queryByTestId('product-gallery')).toBeNull()
  })

  // Los hooks se declaran todos ANTES del `return null` de la lista vacía: si alguno quedara
  // detrás, este re-render con fotos fallaría con el error #310 de React.
  it('pasa de la lista vacía a una con fotos sin romper el orden de los hooks', async () => {
    const { rerender } = await render(<ProductGallery images={[]} />)

    await act(async () => {
      rerender(<ProductGallery images={someImages(3)} />)
    })

    expect(screen.getByTestId('product-gallery')).toBeOnTheScreen()
  })

  it('marca el punto de la foto activa y salta a la que se pulsa', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(3)} onIndexChange={onIndexChange} />)

    expect(screen.getByLabelText('Foto 1 de 3')).toBeSelected()

    await fireEvent.press(screen.getByLabelText('Foto 3 de 3'))

    expect(screen.getByLabelText('Foto 3 de 3')).toBeSelected()
    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('avisa del vídeo sobre la primera foto y retira el aviso al cambiar de foto', async () => {
    await render(
      <ProductGallery images={someImages(3)} videoUrl="https://cdn.test/demo.mp4" />,
    )

    expect(screen.getByTestId('product-gallery-video-badge')).toBeOnTheScreen()

    await tick(1200)

    expect(screen.queryByTestId('product-gallery-video-badge')).toBeNull()
  })

  it('cambia a la foto de la página en la que se suelta el dedo', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(4)} onIndexChange={onIndexChange} />)

    await fireEvent(screen.getByTestId('product-gallery-surface'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: width * 2, y: 0 } },
    })

    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('recorta el desplazamiento que se pasa del final de la galería', async () => {
    const onIndexChange = jest.fn()
    await render(<ProductGallery images={someImages(3)} onIndexChange={onIndexChange} />)

    await fireEvent(screen.getByTestId('product-gallery-surface'), 'momentumScrollEnd', {
      nativeEvent: { contentOffset: { x: width * 99, y: 0 } },
    })

    expect(onIndexChange).toHaveBeenLastCalledWith(2)
  })

  it('sin vídeo no pinta la insignia', async () => {
    await render(<ProductGallery images={someImages(2)} />)

    expect(screen.queryByTestId('product-gallery-video-badge')).toBeNull()
  })
})
