import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { ReactElement, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, PasswordField, Screen } from '@ds/components'
import { ActiveSession } from '@features/account/domain/entities/active-session'
import { checkPassword } from '@features/auth/domain/policies/password-policy'
import { PasswordRequirements } from '@features/auth/presentation/components/PasswordRequirements'

/**
 * Cuántas sesiones se pintan de entrada.
 *
 * <p>No es un adorno: una cuenta con meses de uso acumula CIENTOS de filas, y pintarlas todas dejaba
 * «Eliminar mi cuenta» a veinte arrastres de distancia —una opción que las tiendas exigen que sea
 * fácil de encontrar—. No se esconde ninguna: las demás están a un toque.
 */
const SESIONES_VISIBLES = 8

/**
 * Seguridad de la cuenta: la contraseña y quién está dentro.
 *
 * <p>Las dos cosas viven juntas porque se usan juntas. Quien sospecha que alguien ha entrado en su
 * cuenta hace siempre lo mismo: cierra la sesión ajena y cambia la contraseña; tenerlo en dos
 * pantallas distintas es dejar la mitad del gesto sin hacer.
 */
export function SecurityScreen(): ReactElement {
  const { changePassword, listSessions, revokeSession } = useContainer()
  const queryClient = useQueryClient()

  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [repetida, setRepetida] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [hecho, setHecho] = useState(false)
  const [todasLasSesiones, setTodasLasSesiones] = useState(false)

  const comprobacion = checkPassword(nueva)
  const noCoincide = repetida.length > 0 && repetida !== nueva
  const puedeGuardar = actual.length > 0 && comprobacion.valid && nueva === repetida

  const cambio = useMutation({
    mutationFn: async () => {
      const result = await changePassword.execute(actual, nueva)
      if (!result.ok) throw result.error
    },
    onSuccess: () => {
      setActual('')
      setNueva('')
      setRepetida('')
      setError(null)
      setHecho(true)
    },
    onError: (e: Error) => {
      setHecho(false)
      setError(e.message)
    },
  })

  const sesiones = useQuery({
    queryKey: ['sessions'],
    queryFn: async () => {
      const result = await listSessions.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const cierre = useMutation({
    mutationFn: async (id: string) => {
      const result = await revokeSession.execute(id)
      if (!result.ok) throw result.error
    },
    // Se relee la lista en vez de quitar la fila a mano: si el backend no la cerró, enseñarla como
    // cerrada dejaría a alguien tranquilo con una sesión ajena todavía abierta.
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const abiertas: readonly ActiveSession[] = sesiones.data ?? []
  const ocultas = Math.max(abiertas.length - SESIONES_VISIBLES, 0)

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        <Card>
          <Text className="mb-3 font-medium text-[15px] text-base-content">Cambiar contraseña</Text>

          <View className="gap-3">
            <PasswordField
              label="Contraseña actual"
              testID="contrasena-actual"
              value={actual}
              onChangeText={setActual}
              textContentType="password"
            />
            <PasswordField
              label="Contraseña nueva"
              testID="contrasena-nueva"
              value={nueva}
              onChangeText={setNueva}
              textContentType="newPassword"
            />
            <PasswordRequirements value={nueva} />
            <PasswordField
              label="Repite la contraseña nueva"
              testID="contrasena-repetida"
              value={repetida}
              onChangeText={setRepetida}
              error={noCoincide ? 'Las dos contraseñas no coinciden.' : null}
              textContentType="newPassword"
            />

            {error ? <Alert variant="error" message={error} /> : null}
            {hecho ? <Alert variant="success" message="Contraseña actualizada." /> : null}

            <Button
              title="Guardar contraseña"
              onPress={() => cambio.mutate()}
              disabled={!puedeGuardar}
              loading={cambio.isPending}
            />
          </View>
        </Card>

        <Card>
          <Text className="mb-1 font-medium text-[15px] text-base-content">Eliminar mi cuenta</Text>
          <Text className="mb-3 text-[12px] text-base-content opacity-60">
            Se borran tus datos personales y no se puede deshacer.
          </Text>
          <Button
            testID="ir-a-borrar-cuenta"
            title="Eliminar mi cuenta"
            variant="outline"
            onPress={() => router.push('/settings/delete-account')}
          />
        </Card>
        <Card>
          <Text className="mb-1 font-medium text-[15px] text-base-content">Sesiones abiertas</Text>
          <Text className="mb-3 text-[12px] text-base-content opacity-60">
            Si no reconoces alguna, ciérrala y cambia la contraseña.
          </Text>

          {sesiones.isLoading ? <ActivityIndicator testID="cargando-sesiones" /> : null}
          {sesiones.isError ? (
            <Alert variant="error" message="No se han podido cargar tus sesiones." />
          ) : null}

          {(todasLasSesiones ? abiertas : abiertas.slice(0, SESIONES_VISIBLES)).map((sesion) => (
            <Sesion
              key={sesion.id}
              sesion={sesion}
              cerrando={cierre.isPending && cierre.variables === sesion.id}
              onCerrar={() => cierre.mutate(sesion.id)}
            />
          ))}

          {!todasLasSesiones && ocultas > 0 ? (
            <Pressable
              testID="ver-todas-las-sesiones"
              accessibilityRole="button"
              onPress={() => setTodasLasSesiones(true)}
              className="min-h-11 justify-center"
            >
              <Text className="text-[13px] text-primary">
                Ver las {ocultas} sesiones restantes
              </Text>
            </Pressable>
          ) : null}
        </Card>

      </ScrollView>
    </Screen>
  )
}

interface SesionProps {
  sesion: ActiveSession
  cerrando: boolean
  onCerrar: () => void
}

/**
 * La sesión de este teléfono se marca y NO se ofrece cerrar: para eso está «Cerrar sesión» en la
 * pestaña de cuenta, y un botón aquí que expulsa a quien lo pulsa se lee como un fallo.
 */
function Sesion({ sesion, cerrando, onCerrar }: SesionProps): ReactElement {
  return (
    <View
      testID={`sesion-${sesion.id}`}
      className="flex-row items-center justify-between border-b border-base-300 py-3"
    >
      <View className="flex-1 pr-3">
        <Text className="font-medium text-[14px] text-base-content" numberOfLines={1}>
          {sesion.device}
        </Text>
        <Text className="mt-0.5 text-[12px] text-base-content opacity-60">
          {sesion.ip.length > 0 ? sesion.ip : 'Sin dirección registrada'}
        </Text>
      </View>
      {sesion.current ? (
        <Text className="text-[12px] text-primary">Este dispositivo</Text>
      ) : (
        <Pressable
          testID={`cerrar-sesion-${sesion.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Cerrar la sesión de ${sesion.device}`}
          onPress={onCerrar}
          disabled={cerrando}
          hitSlop={8}
        >
          <Text className="text-[13px] text-error">{cerrando ? 'Cerrando…' : 'Cerrar'}</Text>
        </Pressable>
      )}
    </View>
  )
}
