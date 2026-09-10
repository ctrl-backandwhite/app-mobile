import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Lock, Trash2 } from 'lucide-react-native'
import { ReactElement, useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'

import { useContainer } from '@composition/container.provider'
import { Alert, Button, Card, ListRow, PasswordField, Screen, Spinner, Text } from '@ds/components'
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
        <Text variant="caption" tone="muted" className="mb-2">
          Contraseña, sesiones abiertas y borrado de cuenta.
        </Text>
        <Card>
          <Text variant="heading" className="mb-3">Cambiar contraseña</Text>

          <View className="gap-3">
            <PasswordField
              label="Contraseña actual"
              icon={Lock}
              testID="contrasena-actual"
              value={actual}
              onChangeText={setActual}
              textContentType="password"
            />
            <PasswordField
              label="Contraseña nueva"
              icon={Lock}
              testID="contrasena-nueva"
              value={nueva}
              onChangeText={setNueva}
              textContentType="newPassword"
            />
            <PasswordRequirements value={nueva} />
            <PasswordField
              label="Repite la contraseña nueva"
              icon={Lock}
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
          <Text variant="heading" className="mb-1">Sesiones abiertas</Text>
          <Text variant="caption" tone="muted" className="mb-3">
            Si no reconoces alguna, ciérrala y cambia la contraseña.
          </Text>

          {sesiones.isLoading ? <Spinner testID="cargando-sesiones" className="py-4" /> : null}
          {sesiones.isError ? (
            <Alert variant="error" message="No se han podido cargar tus sesiones." />
          ) : null}

          {(todasLasSesiones ? abiertas : abiertas.slice(0, SESIONES_VISIBLES)).map(
            (sesion, indice, lista) => (
              <Sesion
                key={sesion.id}
                sesion={sesion}
                // Con el enlace de «ver las restantes» debajo, la última fila sí cierra con línea.
                ultima={indice === lista.length - 1 && ocultas === 0}
                cerrando={cierre.isPending && cierre.variables === sesion.id}
                onCerrar={() => cierre.mutate(sesion.id)}
              />
            ),
          )}

          {!todasLasSesiones && ocultas > 0 ? (
            <Pressable
              testID="ver-todas-las-sesiones"
              accessibilityRole="button"
              onPress={() => setTodasLasSesiones(true)}
              className="min-h-11 justify-center"
            >
              <Text variant="label" tone="primary">
                Ver las {ocultas} sesiones restantes
              </Text>
            </Pressable>
          ) : null}
        </Card>

        {/*
          Como fila y no como tarjeta con botón: el rótulo salía dos veces —de título y de botón— y
          un botón rojo suelto al final de la pantalla pesaba más que cambiar la contraseña, que es a
          lo que se entra aquí. Sigue estando, en rojo y con su aviso, pero sin gritar.
        */}
        <Card padding="none" className="px-5">
          <ListRow
            testID="ir-a-borrar-cuenta"
            icon={Trash2}
            danger
            last
            title="Eliminar mi cuenta"
            description="Se borran tus datos personales y no se puede deshacer."
            onPress={() => router.push('/settings/delete-account')}
          />
        </Card>
      </ScrollView>
    </Screen>
  )
}

interface SesionProps {
  sesion: ActiveSession
  /** La última del grupo no dibuja separador: la tarjeta ya cierra por debajo. */
  ultima: boolean
  cerrando: boolean
  onCerrar: () => void
}

/**
 * La sesión de este teléfono se marca y NO se ofrece cerrar: para eso está «Cerrar sesión» en la
 * pestaña de cuenta, y un botón aquí que expulsa a quien lo pulsa se lee como un fallo.
 */
function Sesion({ sesion, ultima, cerrando, onCerrar }: SesionProps): ReactElement {
  return (
    <View
      testID={`sesion-${sesion.id}`}
      className={`flex-row items-center justify-between py-3 ${
        ultima ? '' : 'border-b border-base-200'
      }`}
    >
      <View className="flex-1 pr-3">
        <Text variant="label" numberOfLines={1}>
          {sesion.device}
        </Text>
        <Text variant="caption" tone="muted" className="mt-0.5">
          {sesion.ip.length > 0 ? sesion.ip : 'Sin dirección registrada'}
        </Text>
      </View>
      {sesion.current ? (
        <Text variant="caption" tone="primary" className="shrink-0">
          Este dispositivo
        </Text>
      ) : (
        <Pressable
          testID={`cerrar-sesion-${sesion.id}`}
          accessibilityRole="button"
          accessibilityLabel={`Cerrar la sesión de ${sesion.device}`}
          onPress={onCerrar}
          disabled={cerrando}
          hitSlop={8}
        >
          <Text variant="label" tone="error" className="shrink-0">
            {cerrando ? 'Cerrando…' : 'Cerrar'}
          </Text>
        </Pressable>
      )}
    </View>
  )
}
