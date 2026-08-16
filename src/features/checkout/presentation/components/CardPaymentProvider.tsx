import { StripeProvider } from '@stripe/stripe-react-native'
import { ReactElement } from 'react'

import { useSessionStore } from '@features/auth/presentation/state/session.store'

import { useBillingConfig } from '../hooks/use-billing-config'

interface Props {
  children: ReactElement
}

/**
 * Esquema propio de la aplicación, el mismo que declara `app.config.ts`. Es por donde la pasarela
 * devuelve el control tras un 3-D Secure que sale del proceso a una página del banco.
 */
const URL_SCHEME = 'nx036'

/**
 * Arranca la pasarela con la clave que sirve el backend.
 *
 * La clave llega por red, así que hay un rato en el que no está. Durante ese rato la aplicación se
 * pinta igual —los hijos van fuera del proveedor— porque casi nada de lo que hace depende de poder
 * cobrar: el catálogo, la cesta y los pedidos no tienen por qué esperar a la pasarela. El único que
 * espera es el formulario de tarjeta, que consulta lo mismo y no se enseña hasta tenerla.
 */
export function CardPaymentProvider({ children }: Props): ReactElement {
  const authenticated = useSessionStore((state) => state.status) === 'authenticated'
  const config = useBillingConfig(authenticated)
  const publishableKey = config.data?.publishableKey

  if (!publishableKey) return children

  return (
    <StripeProvider publishableKey={publishableKey} urlScheme={URL_SCHEME}>
      {children}
    </StripeProvider>
  )
}
