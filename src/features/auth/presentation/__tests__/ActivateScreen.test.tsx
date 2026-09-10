import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { ActivateScreen } from '../screens/ActivateScreen'
import { renderWithContainer } from '../testing/render-with-container'

const NEUTRAL = 'Si esa cuenta existe, recibirás un código nuevo.'

function usecaseThatReturns(...results: unknown[]) {
  const execute = jest.fn()
  for (const result of results) execute.mockResolvedValueOnce(result)
  return { execute }
}

describe('ActivateScreen', () => {
  it('activa la cuenta con el código sin espacios y lleva al acceso', async () => {
    const activateAccount = usecaseThatReturns(ok(undefined))
    await renderWithContainer(<ActivateScreen />, { activateAccount: activateAccount as never })

    await fireEvent.changeText(screen.getByLabelText('Código de activación'), '  123456  ')
    await fireEvent.press(screen.getByText('Activar cuenta'))

    await waitFor(() => expect(activateAccount.execute).toHaveBeenCalledWith('123456'))
    // El «cuenta activada» lo da el acceso, no esta pantalla: aquí solo se pasa la llave del aviso.
    expect(global.routerMock.replace).toHaveBeenCalledWith({
      pathname: '/login',
      params: { aviso: 'activada' },
    })
  })

  it('muestra el mensaje del backend cuando el código es erróneo', async () => {
    const activateAccount = usecaseThatReturns(
      err(new AppError('VALIDATION', 'El código no es válido o ha caducado.')),
    )
    await renderWithContainer(<ActivateScreen />, { activateAccount: activateAccount as never })

    await fireEvent.changeText(screen.getByLabelText('Código de activación'), '000000')
    await fireEvent.press(screen.getByText('Activar cuenta'))

    expect(await screen.findByText('El código no es válido o ha caducado.')).toBeTruthy()
    expect(global.routerMock.replace).not.toHaveBeenCalled()
  })

  it('no envía nada mientras no hay código', async () => {
    const activateAccount = usecaseThatReturns(ok(undefined))
    await renderWithContainer(<ActivateScreen />, { activateAccount: activateAccount as never })

    await fireEvent.press(screen.getByText('Activar cuenta'))

    expect(activateAccount.execute).not.toHaveBeenCalled()
  })

  it('avisa de forma neutra al reenviar, aunque el backend falle', async () => {
    const resendActivation = usecaseThatReturns(
      err(new AppError('RATE_LIMITED', 'Demasiados intentos, espera una hora.')),
    )
    await renderWithContainer(<ActivateScreen />, { resendActivation: resendActivation as never })

    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')
    await fireEvent.press(screen.getByText('Reenviar código'))

    expect(await screen.findByText(NEUTRAL)).toBeTruthy()
    expect(resendActivation.execute).toHaveBeenCalledWith('ana@nx036.com')
    // El aviso no puede delatar que la cuenta existe ni que se ha alcanzado un límite.
    expect(screen.queryByText('Demasiados intentos, espera una hora.')).toBeNull()
  })

  it('avisa igual de neutro cuando el reenvío sí funciona', async () => {
    const resendActivation = usecaseThatReturns(ok(undefined))
    await renderWithContainer(<ActivateScreen />, { resendActivation: resendActivation as never })

    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')
    await fireEvent.press(screen.getByText('Reenviar código'))

    expect(await screen.findByText(NEUTRAL)).toBeTruthy()
  })

  it('pide el correo cuando no llega en la ruta y aún no se ha escrito', async () => {
    const resendActivation = usecaseThatReturns(ok(undefined))
    await renderWithContainer(<ActivateScreen />, { resendActivation: resendActivation as never })

    expect(screen.getByLabelText('Correo electrónico')).toBeTruthy()
    await fireEvent.press(screen.getByText('Reenviar código'))

    expect(await screen.findByText('Escribe el correo con el que creaste la cuenta.')).toBeTruthy()
    expect(resendActivation.execute).not.toHaveBeenCalled()
  })
})
