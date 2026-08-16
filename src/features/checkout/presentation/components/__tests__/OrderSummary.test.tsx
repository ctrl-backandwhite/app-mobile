import { render, screen } from '@testing-library/react-native'

import { aShippingQuote } from '@features/checkout/domain/testing/checkout-builders'

import { OrderSummary } from '../OrderSummary'

describe('OrderSummary', () => {
  it('deja un guion donde el backend todavía no ha dicho el importe', async () => {
    // La app no suma ni convierte: antes un hueco que un total que luego se desmiente.
    await render(<OrderSummary />)

    expect(screen.getByLabelText('Total: pendiente')).toBeTruthy()
    expect(screen.getByText(/Elige una dirección/)).toBeTruthy()
  })

  it('pinta los importes tal y como llegan', async () => {
    await render(<OrderSummary quote={aShippingQuote()} />)

    expect(screen.getByLabelText('Subtotal: 25,80 €')).toBeTruthy()
    expect(screen.getByLabelText('Envío: 4,20 €')).toBeTruthy()
    expect(screen.getByLabelText('Total: 36,30 €')).toBeTruthy()
    expect(screen.getByText('7–15 días')).toBeTruthy()
  })

  it('separa los aranceles del envío base', async () => {
    await render(
      <OrderSummary
        quote={aShippingQuote({
          shippingBaseFormatted: '1,20 €',
          customsHandlingUsdCents: 300,
          customsHandlingFormatted: '3,00 €',
        })}
      />,
    )

    expect(screen.getByLabelText('Envío: 1,20 €')).toBeTruthy()
    expect(screen.getByLabelText('Aranceles: 3,00 €')).toBeTruthy()
  })

  it('enseña el descuento cuando lo hay', async () => {
    await render(
      <OrderSummary quote={aShippingQuote({ discountCents: 200, discountFormatted: '2,00 €' })} />,
    )

    expect(screen.getByLabelText('Descuento: 2,00 €')).toBeTruthy()
  })

  it('no pinta importes de un país sin cobertura', async () => {
    await render(<OrderSummary quote={aShippingQuote({ supported: false })} />)

    expect(screen.getByLabelText('Total: pendiente')).toBeTruthy()
    expect(screen.getByText('Todavía no enviamos a ese país.')).toBeTruthy()
  })

  it('avisa del despacho formal de aduana sin bloquear', async () => {
    await render(<OrderSummary quote={aShippingQuote({ customsThresholdExceeded: true })} />)

    expect(screen.getByText(/despacho formal de aduana/)).toBeTruthy()
  })

  it('avisa de que con DDP no se paga nada al recibir', async () => {
    await render(<OrderSummary quote={aShippingQuote({ taxMode: 'DDP' })} />)

    expect(screen.getByText(/no pagarás nada al recibir/)).toBeTruthy()
  })

  it('dice que está calculando mientras la cotización va y viene', async () => {
    await render(<OrderSummary loading />)

    expect(screen.getByText('Calculando envío…')).toBeTruthy()
  })
})
