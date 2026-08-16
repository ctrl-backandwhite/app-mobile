import { ReactElement } from 'react'
import { Text, View } from 'react-native'

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
          <Text className="font-medium text-[14px] text-base-content">
            Información de seguridad
          </Text>
          {warnings.map((warning: string): ReactElement => (
            <View key={warning} className="flex-row gap-2">
              <Text className="text-[13px] text-base-content">•</Text>
              <Text className="flex-1 text-[13px] leading-[19px] text-base-content">{warning}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {manufacturerName || person ? (
        <View
          testID="compliance-identity"
          className="gap-4 rounded-box border border-base-300 bg-base-100 p-4"
        >
          <Text className="font-medium text-[15px] text-base-content">
            Conformidad del producto
          </Text>

          {manufacturerName ? (
            <View className="gap-0.5">
              <Text className="text-[11px] uppercase tracking-wide text-base-content opacity-70">
                Fabricante
              </Text>
              <Text className="font-medium text-[13px] text-base-content">{manufacturerName}</Text>
              {compliance?.manufacturerAddress ? (
                <Text className="text-[13px] leading-[19px] text-base-content">
                  {compliance.manufacturerAddress}
                </Text>
              ) : null}
              {compliance?.manufacturerEmail ? (
                <Text className="text-[13px] text-primary">{compliance.manufacturerEmail}</Text>
              ) : null}
            </View>
          ) : null}

          {person ? (
            <View className="gap-0.5">
              <Text className="text-[11px] uppercase tracking-wide text-base-content opacity-70">
                Operador económico responsable en la UE
              </Text>
              <Text className="text-[13px] text-base-content">
                <Text className="font-medium">{person.name}</Text>
                {/* El cargo llega ya traducido por el backend: la app no lo reinterpreta. */}
                <Text className="opacity-70"> · {person.roleLabel}</Text>
              </Text>
              <Text className="text-[13px] leading-[19px] text-base-content">
                {addressOf(person)}
              </Text>
              <Text className="text-[13px] text-primary">{person.email}</Text>
            </View>
          ) : null}

          <Text className="border-t border-base-300 pt-3 text-[11px] leading-[16px] text-base-content opacity-60">
            Información publicada conforme al Reglamento (UE) 2023/988 relativo a la seguridad
            general de los productos.
          </Text>
        </View>
      ) : null}
    </View>
  )
}
