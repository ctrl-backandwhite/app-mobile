import { ReactElement } from 'react'
import { Text, View } from 'react-native'

import { checkPassword, PasswordRequirement } from '@features/auth/domain/policies/password-policy'

interface Props {
  value: string
}

/** El texto lo decide la presentación; el dominio solo dice qué reglas hay y cuáles se cumplen. */
const LABELS: Record<PasswordRequirement['key'], string> = {
  length: 'Al menos 8 caracteres',
  upper: 'Una letra mayúscula',
  lower: 'Una letra minúscula',
  digit: 'Un número',
  symbol: 'Un símbolo',
}

/**
 * Lista viva de la política de contraseñas.
 *
 * El color por sí solo no comunica el estado a quien no lo distingue, así que cada regla lleva
 * además su marca visible y su estado escrito en el nombre accesible.
 */
export function PasswordRequirements({ value }: Props): ReactElement {
  const { requirements } = checkPassword(value)

  return (
    <View className="mt-2 gap-1">
      {requirements.map((requirement: PasswordRequirement) => (
        <View
          key={requirement.key}
          accessible
          accessibilityRole="text"
          accessibilityLabel={`${LABELS[requirement.key]}: ${requirement.met ? 'cumplido' : 'pendiente'}`}
          className="flex-row items-center gap-2"
        >
          <Text className={`text-[12px] ${requirement.met ? 'text-success' : 'text-base-content opacity-50'}`}>
            {requirement.met ? '✓' : '○'}
          </Text>
          <Text
            className={`text-[12px] ${requirement.met ? 'text-success' : 'text-base-content opacity-60'}`}
          >
            {LABELS[requirement.key]}
          </Text>
        </View>
      ))}
    </View>
  )
}
