import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { useSessionStore } from '@features/auth/presentation/state/session.store'

/**
 * Vacía la caché de consultas cuando cambia el idioma o la divisa.
 *
 * <p>Las dos viajan como CABECERA (`X-Lang`, `X-Currency`), no como parte de la ruta, así que dos
 * respuestas distintas comparten la misma clave de caché: al pasar a euros el catálogo seguía
 * enseñando dólares, y ni siquiera tirando de la lista para refrescar cambiaba —lo cacheado se daba
 * por bueno—. Los importes de la cesta, el presupuesto y el monedero, igual.
 *
 * <p>Se hace aquí y no metiendo la divisa en cada clave a propósito: son más de diez consultas
 * repartidas por cinco pantallas y basta con olvidarla en una nueva para que vuelva a pasar. Esto no
 * se puede olvidar.
 */
export function useRefetchOnRegionChange(): void {
  const queryClient = useQueryClient()
  const locale = useSessionStore((state) => state.locale)
  const currency = useSessionStore((state) => state.currency)
  // El primer render no es un cambio: invalidar ahí dispararía una segunda petición de todo lo que
  // acaba de cargarse.
  const previous = useRef(`${locale}|${currency}`)

  useEffect(() => {
    const current = `${locale}|${currency}`
    if (previous.current === current) return
    previous.current = current
    void queryClient.invalidateQueries()
  }, [locale, currency, queryClient])
}
