import { useQuery } from '@tanstack/react-query'
import { Languages } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { OptionRow, SelectField, Sheet, Spinner } from '@ds/components'
import { Language } from '@features/account/domain/entities/region'

interface Props {
  /** Código del idioma ya elegido, o cadena vacía. */
  value: string
  onChange: (code: string) => void
}

/**
 * El idioma de la tienda, elegido de los diccionarios publicados.
 *
 * <p>Se pedía como código de dos letras escrito a mano. Además de que nadie sabe que el neerlandés es
 * «nl», no había forma de saber en qué idiomas existe la tienda: se podía teclear cualquier cosa y
 * el catálogo llegaba en el idioma de reserva sin decir por qué.
 */
export function LanguageField({ value, onChange }: Props): ReactElement {
  const { listLanguages } = useContainer()
  const [abierto, setAbierto] = useState(false)

  const idiomas = useQuery({
    queryKey: ['languages'],
    queryFn: async () => {
      const result = await listLanguages.execute()
      if (!result.ok) throw result.error
      return result.value
    },
    staleTime: 1000 * 60 * 60,
  })

  const disponibles: readonly Language[] = idiomas.data ?? []
  const elegido = disponibles.find((idioma) => idioma.code === value)

  return (
    <>
      <SelectField
        testID="idioma-de-la-cuenta"
        label="Idioma"
        icon={Languages}
        value={elegido ? `${elegido.flag} ${elegido.label}` : value.length > 0 ? value : null}
        placeholder="Elige tu idioma"
        onPress={(): void => setAbierto(true)}
      />

      <Sheet visible={abierto} onClose={(): void => setAbierto(false)} title="Idioma">
        {idiomas.isLoading ? <Spinner className="py-6" /> : null}
        <View>
          {disponibles.map((idioma, indice) => (
            <OptionRow
              key={idioma.code}
              testID={`idioma-cuenta-${idioma.code}`}
              leading={idioma.flag}
              label={idioma.label}
              selected={idioma.code === value}
              last={indice === disponibles.length - 1}
              onPress={(): void => {
                onChange(idioma.code)
                setAbierto(false)
              }}
            />
          ))}
        </View>
      </Sheet>
    </>
  )
}
