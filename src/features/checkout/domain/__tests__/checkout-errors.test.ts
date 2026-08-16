import { AppError } from '@core/errors/app-error'

import { checkoutErrorMessage, CHECKOUT_MESSAGES } from '../policies/checkout-errors'

describe('mensajes de error de la compra', () => {
  it('explica el saldo corto en lugar de repetir el texto técnico del servidor', () => {
    const error = new AppError('VALIDATION', 'Insufficient wallet balance', 400)

    expect(checkoutErrorMessage(error)).toBe(CHECKOUT_MESSAGES.insufficientWallet)
  })

  it('reconoce el saldo corto también cuando el backend responde en español', () => {
    const error = new AppError('VALIDATION', 'Saldo insuficiente en la cartera', 400)

    expect(checkoutErrorMessage(error)).toBe(CHECKOUT_MESSAGES.insufficientWallet)
  })

  it('pide revisar la cesta cuando una línea ya no existe en el catálogo', () => {
    const error = new AppError('NOT_FOUND', 'CART_ITEM_UNAVAILABLE', 404)

    expect(checkoutErrorMessage(error)).toBe(CHECKOUT_MESSAGES.staleItem)
  })

  it('no enseña un fallo de contrato tal cual', () => {
    const error = new AppError('CONTRACT', 'La respuesta del servidor no tiene el formato esperado.')

    expect(checkoutErrorMessage(error)).toMatch(/Vuelve a intentarlo/)
  })

  it('respeta el mensaje del backend en el resto de casos, que ya viene traducido', () => {
    const error = new AppError('CONFLICT', 'Ese cupón ya se ha usado.', 409)

    expect(checkoutErrorMessage(error)).toBe('Ese cupón ya se ha usado.')
  })
})
