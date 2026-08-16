import { fireEvent, render, screen } from '@testing-library/react-native'

import { CHECKOUT_MESSAGES } from '@features/checkout/domain/policies/checkout-errors'
import { aPaymentMethod, aWalletBalance } from '@features/checkout/domain/testing/checkout-builders'

import { PaymentPicker } from '../PaymentPicker'

describe('PaymentPicker', () => {
  it('nombra la tarjeta guardada con su caducidad', async () => {
    await render(
      <PaymentPicker
        methods={[aPaymentMethod({ expMonth: 4, expYear: 2027 })]}
        walletEnough
        onSelect={jest.fn()}
      />,
    )

    expect(screen.getByText('VISA •••• 4242')).toBeTruthy()
    expect(screen.getByText('Caduca 04/27')).toBeTruthy()
  })

  it('elige el método guardado al pulsarlo', async () => {
    const onSelect = jest.fn()
    await render(
      <PaymentPicker methods={[aPaymentMethod({ id: 'pm_7' })]} walletEnough onSelect={onSelect} />,
    )

    await fireEvent.press(screen.getByLabelText('Pagar con VISA •••• 4242'))

    expect(onSelect).toHaveBeenCalledWith({ kind: 'CARD', savedMethodId: 'pm_7' })
  })

  it('enseña el saldo del monedero ya formateado por el backend', async () => {
    await render(
      <PaymentPicker
        methods={[]}
        wallet={aWalletBalance({ balanceFormatted: '92,30 €' })}
        walletEnough
        onSelect={jest.fn()}
      />,
    )

    expect(screen.getByText('Saldo disponible: 92,30 €')).toBeTruthy()
  })

  it('avisa del saldo corto sobre la propia opción del monedero', async () => {
    await render(
      <PaymentPicker methods={[]} wallet={aWalletBalance()} walletEnough={false} onSelect={jest.fn()} />,
    )

    expect(screen.getByText(CHECKOUT_MESSAGES.insufficientWallet)).toBeTruthy()
  })

  it('elige el monedero al pulsarlo', async () => {
    const onSelect = jest.fn()
    await render(<PaymentPicker methods={[]} walletEnough onSelect={onSelect} />)

    await fireEvent.press(screen.getByLabelText('Pagar con Monedero'))

    expect(onSelect).toHaveBeenCalledWith({ kind: 'WALLET' })
  })

  it('enseña PayPal pero no deja elegirlo todavía', async () => {
    const onSelect = jest.fn()
    await render(<PaymentPicker methods={[]} walletEnough onSelect={onSelect} />)

    await fireEvent.press(screen.getByLabelText('Pagar con PayPal'))

    expect(onSelect).not.toHaveBeenCalled()
    expect(screen.getByText(CHECKOUT_MESSAGES.paypalUnavailable)).toBeTruthy()
  })

  it('dice que está cargando los métodos', async () => {
    await render(<PaymentPicker methods={[]} walletEnough loading onSelect={jest.fn()} />)

    expect(screen.getByText('Cargando métodos…')).toBeTruthy()
  })
})
