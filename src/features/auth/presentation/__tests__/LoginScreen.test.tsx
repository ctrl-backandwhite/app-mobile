import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'

import { LoginScreen } from '../screens/LoginScreen'
import { useSessionStore } from '../state/session.store'
import { renderWithContainer } from '../testing/render-with-container'

const SESSION = { accessToken: 'a', refreshToken: 'r', user: aUser({ displayName: 'Ana' }) }

function signInThatReturns(...results: unknown[]) {
  const execute = jest.fn()
  for (const result of results) execute.mockResolvedValueOnce(result)
  return { execute }
}

async function fillCredentials(): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'Secreta1!')
  await fireEvent.press(screen.getByText('Entrar'))
}

describe('LoginScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'anonymous', accessToken: null, refreshToken: null })
  })

  it('entra con credenciales correctas y guarda la sesión', async () => {
    const signIn = signInThatReturns(ok(SESSION))
    await renderWithContainer(<LoginScreen />, { signIn: signIn as never })

    await fillCredentials()

    await waitFor(() =>
      expect(signIn.execute).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@nx036.com', password: 'Secreta1!' }),
      ),
    )
    await waitFor(() => expect(useSessionStore.getState().status).toBe('authenticated'))
    expect(useSessionStore.getState().accessToken).toBe('a')
    expect(global.routerMock.replace).toHaveBeenCalledWith('/')
  })

  it('muestra el error cuando las credenciales son incorrectas', async () => {
    const signIn = signInThatReturns(
      err(new AppError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.')),
    )
    await renderWithContainer(<LoginScreen />, { signIn: signIn as never })

    await fillCredentials()

    expect(await screen.findByText('Correo o contraseña incorrectos.')).toBeTruthy()
    expect(useSessionStore.getState().status).toBe('anonymous')
  })

  it('pide el código cuando la cuenta tiene doble factor, y sin mostrar error', async () => {
    const signIn = signInThatReturns(err(new AppError('MFA_REQUIRED', 'Introduce el código')))
    await renderWithContainer(<LoginScreen />, { signIn: signIn as never })

    await fillCredentials()

    expect(await screen.findByLabelText('Código de verificación')).toBeTruthy()
    // La contraseña era correcta: presentar esto como un fallo confundiría a quien accede.
    expect(screen.queryByText('Introduce el código')).toBeNull()
  })

  it('reenvía el acceso con el código y mantiene el campo si es inválido', async () => {
    const signIn = signInThatReturns(
      err(new AppError('MFA_REQUIRED', 'x')),
      err(new AppError('MFA_INVALID', 'El código no es válido.')),
    )
    await renderWithContainer(<LoginScreen />, { signIn: signIn as never })

    await fillCredentials()
    await fireEvent.changeText(await screen.findByLabelText('Código de verificación'), '000000')
    await fireEvent.press(screen.getByText('Entrar'))

    expect(await screen.findByText('El código no es válido.')).toBeTruthy()
    expect(screen.getByLabelText('Código de verificación')).toBeTruthy()
    expect(signIn.execute).toHaveBeenLastCalledWith(expect.objectContaining({ otp: '000000' }))
  })

  it('vuelve al paso de contraseña si las credenciales fallan tras pedir el código', async () => {
    const signIn = signInThatReturns(
      err(new AppError('MFA_REQUIRED', 'x')),
      err(new AppError('INVALID_CREDENTIALS', 'Correo o contraseña incorrectos.')),
    )
    await renderWithContainer(<LoginScreen />, { signIn: signIn as never })

    await fillCredentials()
    await fireEvent.changeText(await screen.findByLabelText('Código de verificación'), '000000')
    await fireEvent.press(screen.getByText('Entrar'))

    await waitFor(() => expect(screen.queryByLabelText('Código de verificación')).toBeNull())
  })

  it('lleva al registro y a la recuperación de contraseña', async () => {
    await renderWithContainer(<LoginScreen />, { signIn: signInThatReturns() as never })

    await fireEvent.press(screen.getByText('Crear cuenta'))
    expect(global.routerMock.push).toHaveBeenCalledWith('/register')

    await fireEvent.press(screen.getByText('¿Has olvidado tu contraseña?'))
    expect(global.routerMock.push).toHaveBeenCalledWith('/password-reset')
  })

  /**
   * El acceso social se retiró el 26-ago-2026: la app entra solo con correo y contraseña. Esta prueba
   * es la que impide que vuelva por descuido —un componente compartido, un copiar y pegar del front
   * web— sin que nadie lo haya decidido.
   */
  it('no ofrece ningún acceso con redes sociales', async () => {
    await renderWithContainer(<LoginScreen />, { signIn: signInThatReturns() as never })

    expect(screen.queryByLabelText('Continuar con Google')).toBeNull()
    expect(screen.queryByText(/google/i)).toBeNull()
    expect(screen.queryByText(/o con tu correo/i)).toBeNull()
  })

  it('entra sin marcar la vinculación de cuentas sociales', async () => {
    const signIn = signInThatReturns(ok(SESSION))
    await renderWithContainer(<LoginScreen />, { signIn: signIn as never })

    await fillCredentials()

    // El backend sigue esperando el campo en LoginDtoIn; lo que ya no existe es la vía para ponerlo a true.
    await waitFor(() =>
      expect(signIn.execute).toHaveBeenCalledWith(
        expect.not.objectContaining({ linkSocial: true }),
      ),
    )
  })
})
