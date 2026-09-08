import { labelOf, toWalletTransactionKind } from '../entities/wallet-transaction'

describe('toWalletTransactionKind', () => {
  it('reconoce las clases que publica el backend', () => {
    expect(toWalletTransactionKind('DEPOSIT')).toBe('DEPOSIT')
    expect(toWalletTransactionKind('payment')).toBe('PAYMENT')
    expect(toWalletTransactionKind('  REFUND  ')).toBe('REFUND')
  })

  /**
   * Una clase nueva en el servidor NO puede tumbar el histórico. Cae en «OTHER» y el apunte se pinta
   * con su importe, que es lo que se ha venido a mirar; rechazarlo dejaría la lista entera vacía por
   * una fila que la app todavía no sabe nombrar.
   */
  it('acepta una clase desconocida sin romper', () => {
    expect(toWalletTransactionKind('CASHBACK')).toBe('OTHER')
    expect(toWalletTransactionKind('')).toBe('OTHER')
  })
})

describe('labelOf', () => {
  it('nombra cada clase en el idioma de la tienda', () => {
    expect(labelOf('DEPOSIT')).toBe('Recarga')
    expect(labelOf('PAYMENT')).toBe('Pago de pedido')
  })

  it('llama «Movimiento» a lo que no sabe nombrar, que no miente', () => {
    expect(labelOf('OTHER')).toBe('Movimiento')
  })
})
