import { createContext, ReactNode, useContext, useMemo } from 'react'

import { AppConfig } from '@core/config/env'

import { buildContainer, Container } from './container'

const ContainerContext = createContext<Container | null>(null)

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
  return <ContainerContext.Provider value={container}>{children}</ContainerContext.Provider>
}

export function useContainer(): Container {
  const container = useContext(ContainerContext)
  if (!container) {
    throw new Error('useContainer se ha usado fuera de ContainerProvider')
  }
  return container
}
