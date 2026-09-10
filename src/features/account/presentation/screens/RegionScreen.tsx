import { useQuery } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { ScrollView } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Card, OptionRow, Screen, Spinner, Text } from '@ds/components'
import { currencyName } from '@features/account/domain/entities/currency-names'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

/**
 * Idioma y divisa de la tienda.
 *
 * <p>No es una preferencia decorativa: de la divisa salen los importes que se leen antes de comprar y
 * del idioma sale el texto del catálogo, porque las dos viajan en cada petición al servidor
 * (`X-Currency`, `Accept-Language`). Cambiar aquí cambia lo que se pide, no cómo se pinta.
 *
 * <p>Las listas se piden al servidor y no se escriben en la aplicación: se administran desde el panel,
 * y una lista fija obligaría a publicar una versión nueva en las tiendas para añadir una moneda.
 */
export function RegionScreen(): ReactElement {
  const { listLanguages, listCurrencies, savePreferences } = useContainer()
  const locale = useSessionStore((s) => s.locale)
  const currency = useSessionStore((s) => s.currency)

  const idiomas = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const r = await listLanguages.execute()
      if (!r.ok) throw r.error
      return r.value
    },
    staleTime: 1000 * 60 * 60,
  })

  const divisas = useQuery({
    queryKey: ['currencies'],
    queryFn: async () => {
      const r = await listCurrencies.execute()
      if (!r.ok) throw r.error
      return r.value
    },
    staleTime: 1000 * 60 * 60,
  })

  function eligeIdioma(code: string): void {
    useSessionStore.getState().setLocale(code)
    void savePreferences.execute({ locale: code })
  }

  function eligeDivisa(code: string): void {
    useSessionStore.getState().setCurrency(code)
    void savePreferences.execute({ currency: code })
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <Text variant="caption" tone="muted" className="mb-2">
          Deciden en qué idioma llega el catálogo y en qué moneda se leen los precios.
        </Text>
        <Card>
          <Text variant="heading" className="mb-1">Idioma</Text>
          <Text variant="caption" tone="muted" className="mb-3">
            El catálogo y los mensajes se piden en este idioma.
          </Text>
          {idiomas.isLoading ? (
            <Spinner testID="cargando-idiomas" className="py-4" />
          ) : (
            (idiomas.data ?? []).map((idioma, indice, lista) => (
              <OptionRow
                key={idioma.code}
                testID={`idioma-${idioma.code}`}
                leading={idioma.flag}
                label={idioma.label}
                selected={idioma.code === locale}
                last={indice === lista.length - 1}
                onPress={() => eligeIdioma(idioma.code)}
              />
            ))
          )}
        </Card>

        <Card>
          <Text variant="heading" className="mb-1">Divisa</Text>
          <Text variant="caption" tone="muted" className="mb-3">
            Los precios los calcula el servidor en esta moneda.
          </Text>
          {divisas.isLoading ? (
            <Spinner testID="cargando-divisas" className="py-4" />
          ) : (
            (divisas.data ?? []).map((divisa, indice, lista) => (
              <OptionRow
                key={divisa.code}
                testID={`divisa-${divisa.code}`}
                leading={divisa.flag}
                label={`${divisa.code} · ${currencyName(divisa.code, divisa.name)}`}
                selected={divisa.code === currency}
                last={indice === lista.length - 1}
                onPress={() => eligeDivisa(divisa.code)}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  )
}
