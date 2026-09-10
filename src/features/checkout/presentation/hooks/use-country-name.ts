import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'

import { useCheckoutDeps } from './use-checkout-deps'

/**
 * Traduce un código de país a su nombre.
 *
 * <p>Una dirección que termina en «ES» está a medio escribir: en un sobre nadie pone el código, pone
 * España. El nombre lo sirve el backend ya traducido, así que aquí no hay ninguna tabla de países
 * que mantener en ocho idiomas.
 *
 * <p>Devuelve una FUNCIÓN y no un texto porque una libreta de direcciones tiene tantos países como
 * fichas, y un hook por ficha dentro de un bucle no se puede escribir.
 *
 * <p>Comparte consulta y caché con el selector de país, así que no añade lecturas: mientras la lista
 * no ha llegado se enseña el código, que es lo que se sabe.
 */
export function useCountryNames(): (code: string | undefined) => string {
  const { listCountries } = useCheckoutDeps()

  const paises = useQuery({
    queryKey: ['shipping-countries'],
    queryFn: async () => {
      const result = await listCountries.execute()
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 1000 * 60 * 60,
  })

  const disponibles = paises.data

  return useCallback(
    (code: string | undefined): string => {
      if (!code || code.length === 0) return ''
      return disponibles?.find((pais) => pais.code === code)?.name ?? code
    },
    [disponibles],
  )
}
