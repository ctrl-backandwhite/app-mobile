import { useQuery, UseQueryResult } from '@tanstack/react-query'

import { AppError } from '@core/errors/app-error'
import { BillingConfig } from '@features/checkout/domain/entities/billing-config'

import { useCheckoutDeps } from './use-checkout-deps'

/**
 * Clave compartida a propósito: el proveedor de la pasarela y el formulario de tarjeta preguntan lo
 * mismo, y con la misma clave la caché de consultas lo pide UNA vez y ambos leen esa respuesta.
 */
export const BILLING_CONFIG_KEY = ['billing-config'] as const

/**
 * Ajustes del cobro con tarjeta servidos por el backend.
 *
 * `enabled` deja apagar la consulta mientras no hay sesión: el endpoint es del perfil y pedirlo sin
 * credenciales solo produce un 401. Al iniciar sesión, la consulta se enciende sola y la clave llega
 * sin reiniciar la aplicación.
 */
export function useBillingConfig(enabled = true): UseQueryResult<BillingConfig, AppError> {
  const { getBillingConfig } = useCheckoutDeps()

  return useQuery<BillingConfig, AppError>({
    queryKey: BILLING_CONFIG_KEY,
    enabled,
    // La clave de la pasarela no cambia mientras la aplicación está abierta: volver a pedirla en
    // cada montaje del formulario solo añadiría una espera antes de poder teclear.
    staleTime: Infinity,
    queryFn: async () => {
      const result = await getBillingConfig.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })
}
