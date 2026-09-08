/**
 * Saldo del monedero.
 *
 * `availableUsdCents` es el saldo libre en céntimos de dólar —la divisa interna de la plataforma— y
 * solo se usa para COMPARAR. Lo que se enseña es `balanceFormatted`, que ya viene convertido y
 * formateado por el backend en la divisa de la persona.
 */
export interface WalletBalance {
  readonly availableUsdCents: number
  readonly balanceFormatted?: string
  readonly currency: string
  readonly status: string
  /**
   * Lo retenido por operaciones en curso, ya formateado. Ausente cuando no hay nada retenido: la
   * línea entonces no se pinta, para no inquietar con un «Retenido: 0,00 $».
   */
  readonly holdFormatted?: string
}

/**
 * Si el saldo da para pagar.
 *
 * Es una comprobación PREVIA y deliberadamente conservadora: se compara con el subtotal de producto,
 * que es el único importe en céntimos que publica la cotización. La palabra final la tiene el
 * backend al cobrar; esto solo evita el viaje —y el pedido pendiente— cuando el saldo ya no llega
 * ni para la mercancía.
 *
 * Sin saldo conocido o sin coste conocido devuelve `true`: no se puede afirmar que falte dinero, y
 * bloquear la compra por falta de datos sería peor que dejar que el backend responda.
 */
export function hasEnoughBalance(
  balance?: WalletBalance | null,
  requiredUsdCents?: number | null,
): boolean {
  if (!balance || requiredUsdCents === undefined || requiredUsdCents === null) return true
  if (requiredUsdCents <= 0) return true
  return balance.availableUsdCents >= requiredUsdCents
}
