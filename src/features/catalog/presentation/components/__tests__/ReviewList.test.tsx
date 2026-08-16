import { render, screen } from '@testing-library/react-native'

import { ReviewList } from '../ReviewList'
import { aReview } from '../testing/detail-fixture'

describe('ReviewList', () => {
  it('pinta autor, fecha, título y cuerpo de cada opinión', async () => {
    await render(<ReviewList reviews={[aReview()]} total={1} />)

    expect(screen.getByText('Marta G.')).toBeOnTheScreen()
    expect(screen.getByText('14/08/2026')).toBeOnTheScreen()
    expect(screen.getByText('Muy buena calidad')).toBeOnTheScreen()
    expect(screen.getByText('La tela es gruesa y el corte es el de la foto.')).toBeOnTheScreen()
  })

  it('anuncia la valoración en estrellas', async () => {
    await render(<ReviewList reviews={[aReview({ rating: 4 })]} total={1} />)

    expect(screen.getByLabelText('4 de 5 estrellas')).toBeOnTheScreen()
  })

  it('pinta el total de opiniones del producto, no solo las de esta página', async () => {
    await render(<ReviewList reviews={[aReview()]} total={128} />)

    expect(screen.getByText('128 opiniones')).toBeOnTheScreen()
  })

  it('concuerda el singular cuando solo hay una', async () => {
    await render(<ReviewList reviews={[aReview()]} total={1} />)

    expect(screen.getByText('1 opinión')).toBeOnTheScreen()
  })

  it('aguanta una opinión sin autor, sin fecha y sin texto', async () => {
    await render(
      <ReviewList
        reviews={[
          aReview({ id: 'r-2', authorName: undefined, createdAt: undefined, title: undefined, body: undefined }),
        ]}
        total={1}
      />,
    )

    expect(screen.getByTestId('review-r-2')).toBeOnTheScreen()
    expect(screen.queryByText('Marta G.')).toBeNull()
  })

  it('devuelve la fecha tal cual si no llega en ISO', async () => {
    await render(<ReviewList reviews={[aReview({ createdAt: 'ayer' })]} total={1} />)

    expect(screen.getByText('ayer')).toBeOnTheScreen()
  })

  it('sin opiniones lo dice con un texto discreto', async () => {
    await render(<ReviewList reviews={[]} total={0} />)

    expect(screen.getByText('Todavía no hay opiniones.')).toBeOnTheScreen()
  })
})
