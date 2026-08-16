import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { ok } from '@core/result/result'
import { User } from '@features/auth/domain/entities/user'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { HomeScreen } from '../screens/HomeScreen'
import { useSessionStore } from '../state/session.store'
import { renderWithContainer } from '../testing/render-with-container'

function signedInAs(user: User): void {
  useSessionStore.setState({ user, status: 'authenticated', accessToken: 'a', refreshToken: 'r' })
}

function signOutThatSucceeds() {
  return { execute: jest.fn().mockResolvedValue(ok(undefined)) }
}

describe('HomeScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'anonymous', accessToken: null, refreshToken: null })
  })

  it('saluda con el nombre para mostrar y resume la cuenta', async () => {
    signedInAs(aUser({ displayName: 'Ana', country: 'ES' }))
    await renderWithContainer(<HomeScreen />, { signOut: signOutThatSucceeds() as never })

    expect(screen.getByText('Hola, Ana')).toBeTruthy()
    expect(screen.getByText('Revendedor')).toBeTruthy()
    expect(screen.getByText('ES')).toBeTruthy()
    expect(screen.getByText('USD')).toBeTruthy()
  })

  it('saluda con el correo cuando la cuenta no tiene nombre', async () => {
    signedInAs(
      aUser({ displayName: undefined, firstName: undefined, fullName: undefined, email: 'ana@nx036.com' }),
    )
    await renderWithContainer(<HomeScreen />, { signOut: signOutThatSucceeds() as never })

    expect(screen.getByText('Hola, ana@nx036.com')).toBeTruthy()
  })

  it('cierra la sesión, deja el estado anónimo y vuelve al acceso', async () => {
    signedInAs(aUser())
    const signOut = signOutThatSucceeds()
    await renderWithContainer(<HomeScreen />, { signOut: signOut as never })

    await fireEvent.press(screen.getByText('Cerrar sesión'))

    await waitFor(() => expect(signOut.execute).toHaveBeenCalled())
    await waitFor(() => expect(useSessionStore.getState().status).toBe('anonymous'))
    expect(useSessionStore.getState().accessToken).toBeNull()
    expect(global.routerMock.replace).toHaveBeenCalledWith('/login')
  })

  it('avisa al personal interno de que el back-office está en el escritorio', async () => {
    signedInAs(aUser({ role: 'ADMIN' }))
    await renderWithContainer(<HomeScreen />, { signOut: signOutThatSucceeds() as never })

    expect(screen.getByText(/back-office/)).toBeTruthy()
    expect(screen.getByText(/escritorio/)).toBeTruthy()
  })

  it('no muestra ese aviso a quien revende', async () => {
    signedInAs(aUser({ role: 'USER' }))
    await renderWithContainer(<HomeScreen />, { signOut: signOutThatSucceeds() as never })

    expect(screen.queryByText(/back-office/)).toBeNull()
    expect(screen.queryByText(/escritorio/)).toBeNull()
  })

  it('no revienta mientras el estado se queda sin usuario', async () => {
    await renderWithContainer(<HomeScreen />, { signOut: signOutThatSucceeds() as never })

    expect(screen.getByTestId('home-empty')).toBeTruthy()
    expect(screen.queryByText(/Hola/)).toBeNull()
  })
})
