import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { ScrollView, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, Screen, TextField } from '@ds/components'
import { useSessionStore } from '@features/auth/presentation/state/session.store'

const CONSECUENCIAS = [
  'Se borran tus datos personales y tus direcciones.',
  'Pierdes el acceso a tu histórico de pedidos y a lo que tengas guardado.',
  'El saldo del monedero no se devuelve automáticamente: retíralo antes si te queda.',
]

/**
 * Eliminar la cuenta desde la propia aplicación.
 *
 * <p>No es una función opcional: Apple y Google la exigen para publicar una app que permite
 * registrarse, y remitir a la web es motivo de rechazo en la revisión.
 *
 * <p>Dos pasos y un código al correo, a propósito. Un botón que borra al primer toque es un
 * accidente esperando a ocurrir —basta un teléfono desbloqueado en manos ajenas— y el código
 * demuestra además que quien lo pide tiene acceso al buzón de la cuenta.
 */
export function DeleteAccountScreen(): ReactElement {
  const { requestAccountDeletion, confirmAccountDeletion } = useContainer()

  const [pedido, setPedido] = useState(false)
  const [codigo, setCodigo] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  async function pide(): Promise<void> {
    setEnviando(true)
    setError(null)
    try {
      const result = await requestAccountDeletion.execute()
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      setPedido(true)
    } finally {
      setEnviando(false)
    }
  }

  async function confirma(): Promise<void> {
    setEnviando(true)
    setError(null)
    try {
      const result = await confirmAccountDeletion.execute(codigo)
      if (!result.ok) {
        setError(result.error.message)
        return
      }
      // La cuenta ya no existe: se vacía el estado para que la guarda de rutas deje de darla por
      // buena y no quede un token en memoria apuntando a un usuario borrado.
      useSessionStore.getState().anonymous()
      router.replace('/login')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <Alert variant="warning" message="Esta acción no se puede deshacer." />

        <Card>
          <Text className="mb-2 font-medium text-[15px] text-base-content">Qué va a pasar</Text>
          <View className="gap-2">
            {CONSECUENCIAS.map((linea) => (
              <Text key={linea} className="text-[13px] text-base-content opacity-80">
                {`· ${linea}`}
              </Text>
            ))}
          </View>
        </Card>

        {error ? <Alert variant="error" message={error} /> : null}

        {pedido ? (
          <Card>
            <Text className="mb-3 text-[13px] text-base-content opacity-80">
              Te hemos enviado un código al correo de la cuenta. Escríbelo para confirmar.
            </Text>
            <View className="gap-3">
              <TextField
                label="Código de confirmación"
                testID="codigo-borrado"
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                textContentType="oneTimeCode"
              />
              <Button
                title="Eliminar mi cuenta definitivamente"
                onPress={confirma}
                disabled={codigo.trim().length === 0}
                loading={enviando}
              />
            </View>
          </Card>
        ) : (
          <Button
            title="Enviarme el código de confirmación"
            onPress={pide}
            loading={enviando}
            variant="outline"
          />
        )}
      </ScrollView>
    </Screen>
  )
}
