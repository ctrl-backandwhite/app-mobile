import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { useSessionStore } from '../state/session.store'

describe('session.store', () => {
  beforeEach(() => {
    useSessionStore.setState({
      user: null,
      status: 'loading',
      accessToken: null,
      refreshToken: null,
      currency: 'USD',
      locale: 'es',
    })
  })

  it('arranca en carga para que la navegación no decida antes de tiempo', () => {
    expect(useSessionStore.getState().status).toBe('loading')
  })

  it('deja la sesión autenticada al acceder', () => {
    useSessionStore.getState().signedIn(aUser({ language: 'pt' }), 'a', 'r')

    const state = useSessionStore.getState()
    expect(state.status).toBe('authenticated')
    expect(state.accessToken).toBe('a')
    expect(state.refreshToken).toBe('r')
    // El idioma de la cuenta manda sobre el del dispositivo en cuanto se conoce.
    expect(state.locale).toBe('pt')
  })

  it('cae al castellano cuando la cuenta no declara idioma', () => {
    useSessionStore.getState().restored(aUser({ language: undefined }), 'a', 'r')

    expect(useSessionStore.getState().locale).toBe('es')
  })

  it('borra usuario y tokens al quedar anónimo', () => {
    useSessionStore.getState().signedIn(aUser(), 'a', 'r')

    useSessionStore.getState().anonymous()

    const state = useSessionStore.getState()
    expect(state.status).toBe('anonymous')
    expect(state.user).toBeNull()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
  })

  it('renueva los tokens sin tocar el resto de la sesión', () => {
    const user = aUser()
    useSessionStore.getState().signedIn(user, 'viejo', 'viejo-r')

    useSessionStore.getState().setTokens('nuevo', 'nuevo-r')

    const state = useSessionStore.getState()
    expect(state.accessToken).toBe('nuevo')
    expect(state.status).toBe('authenticated')
    expect(state.user).toBe(user)
  })

  it('actualiza el perfil, la divisa y el idioma', () => {
    const actualizado = aUser({ displayName: 'Ana María' })

    useSessionStore.getState().setUser(actualizado)
    useSessionStore.getState().setCurrency('EUR')
    useSessionStore.getState().setLocale('fr')

    const state = useSessionStore.getState()
    expect(state.user?.displayName).toBe('Ana María')
    expect(state.currency).toBe('EUR')
    expect(state.locale).toBe('fr')
  })
})
