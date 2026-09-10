import { useQuery } from '@tanstack/react-query'
import { Globe, Search } from 'lucide-react-native'
import { ReactElement, useMemo, useState } from 'react'
import { View } from 'react-native'

import { OptionRow, SelectField, Sheet, Spinner, Text, TextField } from '@ds/components'
import { SupportedCountry } from '@features/checkout/domain/entities/shipping'

import { useCheckoutDeps } from '../hooks/use-checkout-deps'

interface Props {
  /** Código ISO de dos letras ya elegido, o cadena vacía. */
  value: string
  onChange: (code: string) => void
  label?: string
  /** Qué se pide cuando aún no hay nada elegido. */
  placeholder?: string
  testID?: string
}

/**
 * Buscar sin depender de las tildes.
 *
 * Quien escribe «peru» espera encontrar «Perú», y en un teclado de móvil poner la tilde cuesta dos
 * toques más. Se sustituyen una a una en vez de usar `normalize`: el motor de JavaScript del
 * teléfono no lleva la tabla Unicode completa y el resultado dependería del dispositivo.
 */
const TILDES: Readonly<Record<string, string>> = {
  á: 'a', à: 'a', ä: 'a', â: 'a', ã: 'a',
  é: 'e', è: 'e', ë: 'e', ê: 'e',
  í: 'i', ì: 'i', ï: 'i', î: 'i',
  ó: 'o', ò: 'o', ö: 'o', ô: 'o', õ: 'o',
  ú: 'u', ù: 'u', ü: 'u', û: 'u',
  ñ: 'n', ç: 'c',
}

function plano(texto: string): string {
  return texto
    .toLowerCase()
    .replace(/[áàäâãéèëêíìïîóòöôõúùüûñç]/g, (letra: string): string => TILDES[letra] ?? letra)
}

/**
 * El país del envío, elegido de la cobertura real.
 *
 * <p>Antes se tecleaba el código de dos letras. Nadie sabe de memoria que Emiratos es «AE», y un
 * código inventado no daba error: se guardaba la dirección y el fallo aparecía mucho después, al no
 * poder cotizar el envío. La lista la sirve el transportista, así que aquí solo aparece lo que de
 * verdad se puede enviar.
 */
export function CountryField({
  value,
  onChange,
  label = 'País',
  placeholder = 'Elige el país de entrega',
  testID,
}: Props): ReactElement {
  const { listCountries } = useCheckoutDeps()
  const [abierto, setAbierto] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  const paises = useQuery({
    queryKey: ['shipping-countries'],
    queryFn: async () => {
      const result = await listCountries.execute()
      if (!result.ok) throw result.error
      return result.value
    },
    // La cobertura la cambia un contrato con el transportista, no el uso de la aplicación.
    staleTime: 1000 * 60 * 60,
  })

  // Sin memorizar, el `??` crea un array nuevo en cada pintada y el filtro se recalcula siempre.
  const disponibles: readonly SupportedCountry[] = useMemo(() => paises.data ?? [], [paises.data])
  const elegido = disponibles.find((pais) => pais.code === value)

  const filtrados = useMemo((): readonly SupportedCountry[] => {
    const texto = plano(busqueda.trim())
    if (texto.length === 0) return disponibles
    return disponibles.filter(
      (pais) => plano(pais.name).includes(texto) || pais.code.toLowerCase().startsWith(texto),
    )
  }, [busqueda, disponibles])

  function elige(code: string): void {
    onChange(code)
    setBusqueda('')
    setAbierto(false)
  }

  return (
    <>
      <SelectField
        testID={testID}
        label={label}
        icon={Globe}
        // Mientras la lista no ha llegado se enseña el código: es lo único que se sabe del país.
        value={elegido?.name ?? (value.length > 0 ? value : null)}
        placeholder={placeholder}
        onPress={(): void => setAbierto(true)}
        error={paises.isError ? 'No se ha podido cargar la lista de destinos.' : null}
      />

      <Sheet visible={abierto} onClose={(): void => setAbierto(false)} title={label}>
        <TextField
          label="Buscar"
          icon={Search}
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Escribe el nombre del país"
          testID="buscar-pais"
        />

        <View className="pt-2">
          {paises.isLoading ? <Spinner testID="cargando-paises" className="py-6" /> : null}

          {!paises.isLoading && filtrados.length === 0 ? (
            <Text variant="body" tone="muted" className="py-6 text-center">
              No enviamos a ningún destino con ese nombre.
            </Text>
          ) : null}

          {filtrados.map((pais, indice) => (
            <OptionRow
              key={pais.code}
              testID={`pais-${pais.code}`}
              label={pais.name}
              selected={pais.code === value}
              last={indice === filtrados.length - 1}
              onPress={(): void => elige(pais.code)}
            />
          ))}
        </View>
      </Sheet>
    </>
  )
}
