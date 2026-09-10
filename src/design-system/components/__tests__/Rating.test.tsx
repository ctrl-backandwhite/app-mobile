import { render, screen } from '@testing-library/react-native'

import { Rating } from '../Rating'

describe('Rating', () => {
  it('anuncia la nota sobre cinco y el número de opiniones', async () => {
    await render(<Rating value={4.3} count={128} />)

    expect(screen.getByLabelText('4.3 de 5, 128 opiniones')).toBeTruthy()
  })

  it('anuncia solo la nota cuando no se conocen las opiniones', async () => {
    await render(<Rating value={5} />)

    expect(screen.getByLabelText('5.0 de 5')).toBeTruthy()
  })

  it('enseña la nota con un decimal', async () => {
    await render(<Rating value={4} count={7} compact />)

    expect(screen.getByText('4.0 (7)')).toBeTruthy()
  })
})
