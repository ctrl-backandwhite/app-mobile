import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { PasswordResetScreen } from '../screens/PasswordResetScreen'
import { useSessionStore } from '../state/session.store'
import { renderWithContainer } from '../testing/render-with-container'

const NEUTRAL = 'Si ese correo tiene cuenta, recibirás un mensaje con las instrucciones.'
const VALID_PASSWORD = 'Secreta1!'

function useCaseThatReturns(...results: unknown[]) {
  const execute = jest.fn()
  for (const result of results) execute.mockResolvedValueOnce(result)
  return { execute }
}

async function askForCode(): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')
  await fireEvent.press(screen.getByText('Enviarme el código'))
}

async function fillConfirmation(password: string, repeated: string): Promise<void> {
  await fireEvent.changeText(await screen.findByLabelText('Código de recuperación'), '123456')
  await fireEvent.changeText(screen.getByLabelText('Nueva contraseña'), password)
  await fireEvent.changeText(screen.getByLabelText('Repite la contraseña'), repeated)
}

describe('PasswordResetScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: null, status: 'anonymous', accessToken: null, refreshToken: null })
  })

  it.each([
    ['la cuenta existe', ok(undefined), null],
    [
      'la cuenta no existe',
      err(new AppError('NOT_FOUND', 'No hay ninguna cuenta con ese correo.')),
      'No hay ninguna cuenta con ese correo.',
    ],
  ])('da el mismo aviso neutro cuando %s', async (_caso, result, revealing) => {
    const request = useCaseThatReturns(result)
    await renderWithContainer(<PasswordResetScreen />, { requestPasswordReset: request as never })

    await askForCode()

    expect(await screen.findByText(NEUTRAL)).toBeTruthy()
    // La enumeración de cuentas se evita justo aquí: el mensaje del backend no llega a pintarse.
    if (revealing) expect(screen.queryByText(revealing)).toBeNull()
    expect(request.execute).toHaveBeenCalledWith('ana@nx036.com')
  })

  it('pasa al paso de confirmación tras pedir el código', async () => {
    const request = useCaseThatReturns(ok(undefined))
    await renderWithContainer(<PasswordResetScreen />, { requestPasswordReset: request as never })

    expect(screen.queryByLabelText('Código de recuperación')).toBeNull()

    await askForCode()

    expect(await screen.findByLabelText('Código de recuperación')).toBeTruthy()
    expect(screen.getByLabelText('Nueva contraseña')).toBeTruthy()
    expect(screen.getByLabelText('Repite la contraseña')).toBeTruthy()
  })

  it('mantiene inerte el botón mientras la contraseña incumple la política', async () => {
    const request = useCaseThatReturns(ok(undefined))
    const confirmReset = useCaseThatReturns(ok(undefined))
    await renderWithContainer(<PasswordResetScreen />, {
      requestPasswordReset: request as never,
      confirmPasswordReset: confirmReset as never,
    })

    await askForCode()
    await fillConfirmation('corta', 'corta')

    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeDisabled()
    await fireEvent.press(screen.getByText('Cambiar contraseña'))
    expect(confirmReset.execute).not.toHaveBeenCalled()
  })

  it('exige que las dos contraseñas coincidan', async () => {
    const request = useCaseThatReturns(ok(undefined))
    const confirmReset = useCaseThatReturns(ok(undefined))
    await renderWithContainer(<PasswordResetScreen />, {
      requestPasswordReset: request as never,
      confirmPasswordReset: confirmReset as never,
    })

    await askForCode()
    await fillConfirmation(VALID_PASSWORD, 'Secreta2!')

    expect(await screen.findByText('Las contraseñas no coinciden.')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).toBeDisabled()
    await fireEvent.press(screen.getByText('Cambiar contraseña'))
    expect(confirmReset.execute).not.toHaveBeenCalled()

    await fireEvent.changeText(screen.getByLabelText('Repite la contraseña'), VALID_PASSWORD)
    expect(screen.getByRole('button', { name: 'Cambiar contraseña' })).not.toBeDisabled()
  })

  it('cambia la contraseña y lleva al acceso', async () => {
    const request = useCaseThatReturns(ok(undefined))
    const confirmReset = useCaseThatReturns(ok(undefined))
    await renderWithContainer(<PasswordResetScreen />, {
      requestPasswordReset: request as never,
      confirmPasswordReset: confirmReset as never,
    })

    await askForCode()
    await fillConfirmation(VALID_PASSWORD, VALID_PASSWORD)
    await fireEvent.press(screen.getByText('Cambiar contraseña'))

    await waitFor(() =>
      expect(confirmReset.execute).toHaveBeenCalledWith('123456', VALID_PASSWORD),
    )
    await waitFor(() => expect(global.routerMock.replace).toHaveBeenCalledWith('/login'))
  })

  it('muestra el error cuando el código ya no vale y no navega', async () => {
    const request = useCaseThatReturns(ok(undefined))
    const confirmReset = useCaseThatReturns(
      err(new AppError('VALIDATION', 'El código ha caducado.')),
    )
    await renderWithContainer(<PasswordResetScreen />, {
      requestPasswordReset: request as never,
      confirmPasswordReset: confirmReset as never,
    })

    await askForCode()
    await fillConfirmation(VALID_PASSWORD, VALID_PASSWORD)
    await fireEvent.press(screen.getByText('Cambiar contraseña'))

    expect(await screen.findByText('El código ha caducado.')).toBeTruthy()
    expect(global.routerMock.replace).not.toHaveBeenCalled()
  })
})
