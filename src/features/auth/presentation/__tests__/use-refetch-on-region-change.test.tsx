import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, waitFor } from '@testing-library/react-native'
import { ReactElement } from 'react'
import { Text } from 'react-native'

import { useRefetchOnRegionChange } from '../hooks/use-refetch-on-region-change'
import { useSessionStore } from '../state/session.store'

function Probe(): ReactElement {
  useRefetchOnRegionChange()
  return <Text>listo</Text>
}

/**
 * El idioma y la divisa viajan como cabecera, no en la ruta: dos respuestas distintas comparten
 * clave de caché. Al pasar a euros el catálogo seguía enseñando dólares.
 */
describe('useRefetchOnRegionChange', () => {
  let queryClient: QueryClient
  let invalidate: jest.SpyInstance

  beforeEach(() => {
    useSessionStore.setState({ locale: 'es', currency: 'USD' })
    queryClient = new QueryClient()
    invalidate = jest.spyOn(queryClient, 'invalidateQueries').mockResolvedValue(undefined)
  })

  async function mount(): Promise<void> {
    await render(
      <QueryClientProvider client={queryClient}>
        <Probe />
      </QueryClientProvider>,
    )
  }

  it('no invalida nada al montar: lo que acaba de cargarse sigue valiendo', async () => {
    await mount()

    expect(invalidate).not.toHaveBeenCalled()
  })

  it('invalida todo cuando cambia la divisa', async () => {
    await mount()

    await act(async () => {
      useSessionStore.setState({ currency: 'EUR' })
    })

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1))
  })

  it('invalida todo cuando cambia el idioma', async () => {
    await mount()

    await act(async () => {
      useSessionStore.setState({ locale: 'en' })
    })

    await waitFor(() => expect(invalidate).toHaveBeenCalledTimes(1))
  })

  it('volver a poner lo mismo no dispara nada', async () => {
    await mount()

    await act(async () => {
      useSessionStore.setState({ currency: 'USD', locale: 'es' })
    })

    expect(invalidate).not.toHaveBeenCalled()
  })
})
