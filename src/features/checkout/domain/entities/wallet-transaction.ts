/**
 * Un apunte del monedero.
 *
 * <p>Los importes llegan como CADENAS ya formateadas por el backend, y en DÓLARES: el monedero lleva
 * su saldo canónico en céntimos de dólar y ahí no hay conversión que hacer. El saldo de la cabecera
 * sí viene convertido a la divisa de quien mira; los apuntes no, y mezclar las dos cosas en la misma
 * lista daría un histórico que no suma hasta el saldo.
 *
 * <p>`esEntrada` sale del signo del importe canónico, que sí es un número del servidor: deducirlo del
 * texto formateado obligaría a interpretar el signo en ocho convenciones de idioma distintas.
 */
export interface WalletTransaction {
  readonly id: string
  readonly kind: WalletTransactionKind
  readonly amountFormatted: string
  readonly balanceAfterFormatted: string
  readonly esEntrada: boolean
  readonly description?: string
  readonly createdAt: string
}

/**
 * Las clases que publica el backend. Se valida como texto libre en la frontera y se normaliza aquí:
 * una clase nueva en el servidor no puede tumbar el histórico entero y dejar sin ver los apuntes que
 * la app sí sabe pintar.
 */
export type WalletTransactionKind =
  | 'DEPOSIT'
  | 'WITHDRAW'
  | 'PAYMENT'
  | 'REFUND'
  | 'HOLD'
  | 'RELEASE'
  | 'ADJUSTMENT'
  | 'OTHER'

const CONOCIDAS: readonly WalletTransactionKind[] = [
  'DEPOSIT',
  'WITHDRAW',
  'PAYMENT',
  'REFUND',
  'HOLD',
  'RELEASE',
  'ADJUSTMENT',
]

export function toWalletTransactionKind(raw: string): WalletTransactionKind {
  const normalizada = raw.trim().toUpperCase()
  return CONOCIDAS.find((k) => k === normalizada) ?? 'OTHER'
}

/** Etiqueta legible de cada clase. `OTHER` se queda en «Movimiento», que no miente. */
const ETIQUETAS: Record<WalletTransactionKind, string> = {
  DEPOSIT: 'Recarga',
  WITHDRAW: 'Retirada',
  PAYMENT: 'Pago de pedido',
  REFUND: 'Devolución',
  HOLD: 'Retención',
  RELEASE: 'Liberación',
  ADJUSTMENT: 'Ajuste',
  OTHER: 'Movimiento',
}

export function labelOf(kind: WalletTransactionKind): string {
  return ETIQUETAS[kind]
}
