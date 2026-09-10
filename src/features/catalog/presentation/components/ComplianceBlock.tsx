import { ReactElement } from 'react'
import { View } from 'react-native'

import { Text } from '@ds/components'

import {
  ProductCompliance,
  ResponsiblePerson,
} from '@features/catalog/domain/entities/product-detail'

interface Props {
  compliance?: ProductCompliance
}

/** Dirección de la persona responsable en una sola línea, con las partes que de verdad llegan. */
function addressOf(person: ResponsiblePerson): string {
  const postal = person.postalCode ? `${person.postalCode} ` : ''
  return `${person.addressLine}, ${postal}${person.city} (${person.country})`
}

/**
 * Bloque de cumplimiento del Reglamento (UE) 2023/988.
 *
 * El art. 19 obliga a que la OFERTA en línea muestre el fabricante (a), la persona responsable
 * establecida en la Unión (b) y las advertencias de seguridad (d). Por eso se pinta SIEMPRE que
 * llegue el dato y no se esconde tras un desplegable: la norma habla de la oferta, y una advertencia
 * que hay que abrir para leer no cumple ese propósito.
 *
 * Las advertencias van las primeras y destacadas —son información de seguridad—; la identidad del
 * fabricante y del operador va después, como información legal de consulta.
 */
export function ComplianceBlock({ compliance }: Props): ReactElement | null {
  const warnings = compliance?.safetyWarnings ?? []
  const manufacturerName = compliance?.manufacturerName
  const person = compliance?.responsiblePerson

  if (!manufacturerName && !person && warnings.length === 0) {
    return null
  }

  return (
    <View className="gap-4">
      {warnings.length > 0 ? (
        <View
          testID="compliance-safety-warnings"
          accessibilityRole="alert"
          className="gap-1.5 rounded-box border border-warning bg-warning/10 p-4"
        >
          <Text variant="label">
            Información de seguridad
          </Text>
          {warnings.map((warning: string): ReactElement => (
            <View key={warning} className="flex-row gap-2">
              <Text variant="label">•</Text>
              <Text variant="label" className="flex-1 leading-[19px]">{warning}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {manufacturerName || person ? (
        <View
          testID="compliance-identity"
          className="gap-4 rounded-box border border-base-300 bg-base-100 p-4"
        >
          <Text variant="heading">
            Conformidad del producto
          </Text>

          {manufacturerName ? (
            <View className="gap-0.5">
              <Text variant="caption" tone="muted" className="uppercase tracking-wide">
                Fabricante
              </Text>
              <Text variant="label">{manufacturerName}</Text>
              {compliance?.manufacturerAddress ? (
                <Text variant="label" className="leading-[19px]">
                  {compliance.manufacturerAddress}
                </Text>
              ) : null}
              {compliance?.manufacturerEmail ? (
                <Text variant="label" tone="primary">{compliance.manufacturerEmail}</Text>
              ) : null}
            </View>
          ) : null}

          {person ? (
            <View className="gap-0.5">
              <Text variant="caption" tone="muted" className="uppercase tracking-wide">
                Operador económico responsable en la UE
              </Text>
              <Text variant="label">
                <Text >{person.name}</Text>
                {/* El cargo llega ya traducido por el backend: la app no lo reinterpreta. */}
                <Text tone="muted"> · {person.roleLabel}</Text>
              </Text>
              <Text variant="label" className="leading-[19px]">
                {addressOf(person)}
              </Text>
              <Text variant="label" tone="primary">{person.email}</Text>
            </View>
          ) : null}

          <Text variant="caption" tone="muted" className="border-t border-base-300 pt-3 leading-[16px]">
            Información publicada conforme al Reglamento (UE) 2023/988 relativo a la seguridad
            general de los productos.
          </Text>
        </View>
      ) : null}
    </View>
  )
}
