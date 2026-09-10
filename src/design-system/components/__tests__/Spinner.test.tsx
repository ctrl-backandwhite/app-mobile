import { render, screen } from '@testing-library/react-native'

import { light } from '../../tokens/colors'
import { Spinner } from '../Spinner'

/**
 * La rueda de espera existe para que nadie pinte un `ActivityIndicator` a pelo: sin `color`, Android
 * lo dibuja de su verde azulado de serie, que no está en la paleta.
 */
describe('Spinner', () => {
  it('gira siempre con el color de marca', async () => {
    await render(<Spinner testID="cargando" />)

    expect(screen.getByTestId('cargando').props.color).toBe(light.primary)
  })

  it('el tamaño pequeño es para esperas dentro de una línea', async () => {
    await render(<Spinner size="sm" testID="cargando" />)

    expect(screen.getByTestId('cargando').props.size).toBe('small')
  })

  it('por omisión ocupa un bloque', async () => {
    await render(<Spinner testID="cargando" />)

    expect(screen.getByTestId('cargando').props.size).toBe('large')
  })
})
