import { Eye, EyeOff } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable, View } from 'react-native'

import { Icon } from './Icon'
import { TextField, TextFieldProps } from './TextField'

type Props = Omit<TextFieldProps, 'secureTextEntry'>

export function PasswordField({ ...field }: Props): ReactElement {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!visible}
        // El texto no puede pasar por debajo del alternador; el resto del estilo lo pone TextField.
        style={{ paddingRight: 36 }}
        {...field}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        accessibilityState={{ selected: visible }}
        onPress={() => setVisible((previous: boolean): boolean => !previous)}
        hitSlop={8}
        // 26 px = alto de la etiqueta más su separación: deja el botón centrado en la caja del campo.
        className="absolute right-1 top-[26px] h-12 w-11 items-center justify-center"
      >
        <Icon glyph={visible ? EyeOff : Eye} size="md" tone="muted" />
      </Pressable>
    </View>
  )
}
