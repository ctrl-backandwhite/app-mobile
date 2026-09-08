/**
 * Un plan de la plataforma, tal y como lo publica el backend.
 *
 * <p>Los precios llegan formateados por el servidor. Los céntimos solo se llevan para ORDENAR y
 * comparar: escribir un importe en el cliente acabaría, tarde o temprano, en un precio que no cuadra
 * con lo que se cobra.
 */
export interface Plan {
  readonly id: string
  readonly code: string
  readonly name: string
  readonly description?: string
  readonly monthlyFormatted?: string
  readonly yearlyFormatted?: string
}

/**
 * La suscripción vigente de la cuenta.
 *
 * <p>Que no haya suscripción NO es un error: el backend responde sin cuerpo y significa «esta cuenta
 * no tiene plan». Tratarlo como fallo pintaría un aviso rojo a todo el que nunca contrató nada.
 */
export interface Subscription {
  readonly planId: string
  readonly status: string
  readonly billingPeriod: string
  readonly currentPeriodEnd?: string
  readonly cancelAt?: string
}

/** El nombre del plan contratado, o su identificador si la lista de planes no llegó. */
export function planNameOf(subscription: Subscription, plans: readonly Plan[]): string {
  return plans.find((p) => p.id === subscription.planId)?.name ?? subscription.planId
}
