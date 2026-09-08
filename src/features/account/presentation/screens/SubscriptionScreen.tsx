import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ReactElement, useState } from 'react'
import { Linking, ScrollView, Text, View } from 'react-native'

import { useAppConfig, useContainer } from '@composition/container.provider'
import { Alert, Button, Card, Screen } from '@ds/components'
import { planNameOf, Subscription } from '@features/account/domain/entities/subscription'

/** Lo que dice el backend, en el idioma de la tienda. Lo que no se sepa nombrar se enseña tal cual. */
const ESTADOS: Record<string, string> = {
  ACTIVE: 'Activa',
  TRIALING: 'En periodo de prueba',
  PAST_DUE: 'Pago pendiente',
  CANCELED: 'Cancelada',
  INCOMPLETE: 'Sin completar',
}

const PERIODOS: Record<string, string> = {
  MONTHLY: 'Mensual',
  YEARLY: 'Anual',
}

/**
 * La suscripción de la cuenta.
 *
 * <p>Aquí se VE y se CANCELA, pero no se contrata ni se cambia de plan. No es una carencia: vender una
 * suscripción digital dentro de una app de iOS obliga a cobrarla con el sistema de compras de Apple,
 * y hacerlo con nuestra pasarela es motivo de rechazo en la revisión. Contratar se hace en el
 * escritorio, y desde aquí se lleva hasta allí.
 */
export function SubscriptionScreen(): ReactElement {
  const { getSubscription, cancelSubscription } = useContainer()
  const config = useAppConfig()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)

  const estado = useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const result = await getSubscription.execute()
      if (!result.ok) throw result.error
      return result.value
    },
  })

  const cancelacion = useMutation({
    mutationFn: async () => {
      const result = await cancelSubscription.execute()
      if (!result.ok) throw result.error
    },
    onSuccess: () => {
      setError(null)
      void queryClient.invalidateQueries({ queryKey: ['subscription'] })
    },
    onError: (e: Error) => setError(e.message),
  })

  function abrePlanesEnElEscritorio(): void {
    void Linking.openURL(`${config.webBaseUrl}/planes`).catch(() => undefined)
  }

  if (estado.isLoading) {
    return (
      <Screen>
        <Text className="py-8 text-center text-[13px] text-base-content opacity-60">Cargando…</Text>
      </Screen>
    )
  }

  if (estado.isError) {
    return (
      <Screen>
        <Alert variant="error" message="No se ha podido cargar tu suscripción." />
        <View className="mt-4">
          <Button title="Reintentar" onPress={(): void => void estado.refetch()} />
        </View>
      </Screen>
    )
  }

  const suscripcion = estado.data?.subscription ?? null
  const planes = estado.data?.plans ?? []

  return (
    <Screen padded={false}>
      <ScrollView contentContainerClassName="gap-4 p-5">
        {suscripcion ? (
          <Contratada
            suscripcion={suscripcion}
            nombre={planNameOf(suscripcion, planes)}
            cancelando={cancelacion.isPending}
            onCancelar={(): void => cancelacion.mutate()}
          />
        ) : (
          <Card>
            <Text className="font-medium text-[15px] text-base-content">Sin plan contratado</Text>
            <Text className="mt-1 text-[13px] text-base-content opacity-70">
              Estás usando la cuenta gratuita. Los planes amplían límites y funciones.
            </Text>
          </Card>
        )}

        {error ? <Alert variant="error" message={error} /> : null}

        <Card>
          <Text className="font-medium text-[15px] text-base-content">Cambiar de plan</Text>
          <Text className="mt-1 mb-3 text-[13px] text-base-content opacity-70">
            La contratación se hace desde el escritorio.
          </Text>
          <Button
            testID="ver-planes-en-la-web"
            title="Ver los planes"
            variant="outline"
            onPress={abrePlanesEnElEscritorio}
          />
        </Card>
      </ScrollView>
    </Screen>
  )
}

interface ContratadaProps {
  suscripcion: Subscription
  nombre: string
  cancelando: boolean
  onCancelar: () => void
}

function Contratada({ suscripcion, nombre, cancelando, onCancelar }: ContratadaProps): ReactElement {
  const yaCancelada = Boolean(suscripcion.cancelAt) || suscripcion.status === 'CANCELED'

  return (
    <Card>
      <Text className="text-[13px] text-base-content opacity-70">Tu plan</Text>
      <Text testID="nombre-del-plan" className="mt-1 font-medium text-[22px] text-base-content">
        {nombre}
      </Text>

      <View className="mt-4 gap-3">
        <Dato etiqueta="Estado" valor={ESTADOS[suscripcion.status] ?? suscripcion.status} />
        <Dato
          etiqueta="Facturación"
          valor={PERIODOS[suscripcion.billingPeriod] ?? suscripcion.billingPeriod}
        />
        {suscripcion.currentPeriodEnd ? (
          <Dato etiqueta="Renueva el" valor={fecha(suscripcion.currentPeriodEnd)} />
        ) : null}
      </View>

      {yaCancelada ? (
        <View className="mt-4">
          {/* Cancelada no es lo mismo que terminada: se sigue usando hasta el final del periodo pagado. */}
          <Alert
            variant="info"
            message={
              suscripcion.cancelAt
                ? `Cancelada. Podrás seguir usándola hasta el ${fecha(suscripcion.cancelAt)}.`
                : 'Cancelada.'
            }
          />
        </View>
      ) : (
        <View className="mt-4">
          <Button
            testID="cancelar-suscripcion"
            title="Cancelar suscripción"
            variant="outline"
            onPress={onCancelar}
            loading={cancelando}
          />
        </View>
      )}
    </Card>
  )
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }): ReactElement {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-[13px] text-base-content opacity-70">{etiqueta}</Text>
      <Text className="font-medium text-[14px] text-base-content">{valor}</Text>
    </View>
  )
}

/**
 * Solo el día, sin la hora: lo que importa es hasta cuándo, no a qué minuto. Si la fecha no se puede
 * leer se enseña tal cual llegó, que es más honesto que un «Invalid Date».
 */
function fecha(iso: string): string {
  const valor = new Date(iso)
  return Number.isNaN(valor.getTime()) ? iso : valor.toLocaleDateString()
}
