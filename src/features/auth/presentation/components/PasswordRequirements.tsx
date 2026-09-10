import { Check, Circle } from 'lucide-react-native'
import { ReactElement } from 'react'
import { View } from 'react-native'

import { Icon, Text } from '@ds/components'

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
          <Icon
            glyph={requirement.met ? Check : Circle}
            size="sm"
            tone={requirement.met ? 'success' : 'muted'}
          />
          <Text
            variant="caption"
            tone={requirement.met ? 'success' : 'muted'}
          >
            {LABELS[requirement.key]}
          </Text>
        </View>
      ))}
    </View>
  )
}
