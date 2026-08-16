import { AppError } from '@core/errors/app-error'

import { aCartLine } from '../testing/cart-builders'
import { FakeSavedCartRepository } from '../testing/fake-saved-cart-repository'
import { MergeGuestCart } from '../usecases/merge-guest-cart'

describe('MergeGuestCart', () => {
  it('sube los guardados del invitado y devuelve la lista de la cuenta', async () => {
    const account = [aCartLine(), aCartLine({ productId: 'p-2' })]
    const savedCart = new FakeSavedCartRepository({ saved: account })

    const result = await new MergeGuestCart(savedCart).execute([aCartLine({ productId: 'p-2' })])

    expect(result).toEqual({ ok: true, value: account })
    expect(savedCart.merged).toEqual([[aCartLine({ productId: 'p-2' })]])
  })

  it('sin nada que fusionar solo pide la lista de la cuenta', async () => {
    const savedCart = new FakeSavedCartRepository({ saved: [aCartLine()] })

    const result = await new MergeGuestCart(savedCart).execute([])

    expect(result.ok && result.value).toEqual([aCartLine()])
    expect(savedCart.merged).toEqual([])
    expect(savedCart.listed).toBe(1)
  })

  it('propaga el fallo del backend', async () => {
    const savedCart = new FakeSavedCartRepository({ error: new AppError('NETWORK', 'sin conexión') })

    const result = await new MergeGuestCart(savedCart).execute([aCartLine()])

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})
