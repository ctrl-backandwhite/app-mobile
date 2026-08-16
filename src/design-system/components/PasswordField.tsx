import { ReactElement, useState } from 'react'
import { Pressable, View } from 'react-native'

import { TextField, TextFieldProps } from './TextField'

type Props = Omit<TextFieldProps, 'secureTextEntry'>

/**
 * Ojo dibujado con vistas: la aplicación no incorpora ninguna familia de iconos, y un glifo del
 * sistema o un emoji desentonaría con el trazo fino del escritorio.
 */
function EyeIcon({ crossed }: { crossed: boolean }): ReactElement {
  return (
    <View className="h-5 w-5 items-center justify-center opacity-70">
      <View className="h-3.5 w-5 rounded-full border border-base-content" />
      <View className="absolute h-1.5 w-1.5 rounded-full bg-base-content" />
      {crossed ? <View className="absolute h-px w-6 rotate-45 bg-base-content" /> : null}
    </View>
  )
}

export function PasswordField({ ...field }: Props): ReactElement {
  const [visible, setVisible] = useState(false)

  return (
    <View>
      <TextField
        autoCapitalize="none"
        autoCorrect={false}
        secureTextEntry={!visible}
        // El texto no puede pasar por debajo del alternador; el resto del estilo lo pone TextField.
        style={{ paddingRight: 48 }}
        {...field}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
        accessibilityState={{ selected: visible }}
        onPress={() => setVisible((previous: boolean): boolean => !previous)}
        hitSlop={8}
        // 22 px = alto de la etiqueta más su separación: deja el botón centrado en la caja del campo.
        className="absolute right-1 top-[22px] h-12 w-11 items-center justify-center"
      >
        <EyeIcon crossed={visible} />
      </Pressable>
    </View>
  )
}
