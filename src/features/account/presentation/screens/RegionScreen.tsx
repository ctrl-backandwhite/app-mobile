import { useQuery } from '@tanstack/react-query'
import { ReactElement } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Card, Screen } from '@ds/components'
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
        <Card>
          <Text className="mb-1 font-medium text-[15px] text-base-content">Idioma</Text>
          <Text className="mb-3 text-[12px] text-base-content opacity-60">
            El catálogo y los mensajes se piden en este idioma.
          </Text>
          {idiomas.isLoading ? (
            <ActivityIndicator testID="cargando-idiomas" />
          ) : (
            (idiomas.data ?? []).map((idioma) => (
              <Fila
                key={idioma.code}
                testID={`idioma-${idioma.code}`}
                emoji={idioma.flag}
                titulo={idioma.label}
                elegido={idioma.code === locale}
                onPress={() => eligeIdioma(idioma.code)}
              />
            ))
          )}
        </Card>

        <Card>
          <Text className="mb-1 font-medium text-[15px] text-base-content">Divisa</Text>
          <Text className="mb-3 text-[12px] text-base-content opacity-60">
            Los precios los calcula el servidor en esta moneda.
          </Text>
          {divisas.isLoading ? (
            <ActivityIndicator testID="cargando-divisas" />
          ) : (
            (divisas.data ?? []).map((divisa) => (
              <Fila
                key={divisa.code}
                testID={`divisa-${divisa.code}`}
                emoji={divisa.flag}
                titulo={`${divisa.code} · ${divisa.name}`}
                elegido={divisa.code === currency}
                onPress={() => eligeDivisa(divisa.code)}
              />
            ))
          )}
        </Card>
      </ScrollView>
    </Screen>
  )
}

interface FilaProps {
  emoji: string
  titulo: string
  elegido: boolean
  testID: string
  onPress: () => void
}

/** Una opción de la lista. Alto de dedo y la marca a la derecha, donde se mira. */
function Fila({ emoji, titulo, elegido, testID, onPress }: FilaProps): ReactElement {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="radio"
      accessibilityState={{ selected: elegido }}
      onPress={onPress}
      className="min-h-11 flex-row items-center gap-3 border-b border-base-300 py-3"
    >
      <Text className="text-[18px]">{emoji}</Text>
      <Text className="flex-1 text-[14px] text-base-content">{titulo}</Text>
      {elegido ? <Text className="text-[15px] text-primary">✓</Text> : <View />}
    </Pressable>
  )
}
