import { createContext, ReactNode, useContext, useMemo } from 'react'

import { AppConfig } from '@core/config/env'

import { buildContainer, Container } from './container'

const ContainerContext = createContext<Container | null>(null)

/**
 * La configuración, disponible por contexto igual que el contenedor.
 *
 * <p>Una pantalla que llama a `getAppConfig()` lee las variables de entorno del proceso, así que en
 * las pruebas revienta con «Falta la variable EXPO_PUBLIC_API_BASE_URL» aunque el montaje ya le haya
 * inyectado una configuración. Tomarla de aquí hace que la pantalla use la que le den, que es lo que
 * ya se hace con todo lo demás.
 */
const ConfigContext = createContext<AppConfig | null>(null)

interface Props {
  config: AppConfig
  children: ReactNode
  /** Contenedor ya construido. Solo lo usan las pruebas, para inyectar dobles de los casos de uso. */
  value?: Container
}

export function ContainerProvider({ config, children, value }: Props) {
  // El contenedor se construye una sola vez: recrearlo en cada render tiraría el cliente HTTP y con
  // él cualquier renovación de token en curso.
  const container = useMemo(() => value ?? buildContainer(config), [config, value])
  return (
    <ConfigContext.Provider value={config}>
      <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>
    </ConfigContext.Provider>
  )
}

export function useAppConfig(): AppConfig {
  const config = useContext(ConfigContext)
  if (!config) {
    throw new Error('useAppConfig se ha usado fuera de ContainerProvider')
  }
  return config
}

export function useContainer(): Container {
  const container = useContext(ContainerContext)
  if (!container) {
    throw new Error('useContainer se ha usado fuera de ContainerProvider')
  }
  return container
}
