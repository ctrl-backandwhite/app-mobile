import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { RegisterScreen } from '../screens/RegisterScreen'
import { renderWithContainer } from '../testing/render-with-container'

const STRONG = 'Secreta1!'
const TERMS = 'Acepto los términos y condiciones'
const MARKETING = 'Quiero recibir novedades y ofertas por correo'

function registerThatReturns(...results: unknown[]) {
  const execute = jest.fn()
  for (const result of results) execute.mockResolvedValueOnce(result)
  return { execute }
}

async function fillForm(password: string = STRONG): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')
  await fireEvent.changeText(screen.getByLabelText('Contraseña'), password)
  await fireEvent.changeText(screen.getByLabelText('Nombre'), 'Ana')
  await fireEvent.changeText(screen.getByLabelText('Empresa (opcional)'), 'Nexa')
}

describe('RegisterScreen', () => {
  it('no llama al caso de uso mientras la contraseña incumple la política', async () => {
    const register = registerThatReturns(ok('u-nuevo'))
    await renderWithContainer(<RegisterScreen />, { register: register as never })

    await fillForm('secreta')
    await fireEvent.press(screen.getByLabelText(TERMS))
    await fireEvent.press(screen.getByText('Crear cuenta'))

    expect(register.execute).not.toHaveBeenCalled()
  })

  it('marca los requisitos que se van cumpliendo según se escribe', async () => {
    await renderWithContainer(<RegisterScreen />, { register: registerThatReturns() as never })

    expect(screen.getByLabelText('Al menos 8 caracteres: pendiente')).toBeTruthy()
    expect(screen.getByLabelText('Un símbolo: pendiente')).toBeTruthy()

    await fireEvent.changeText(screen.getByLabelText('Contraseña'), 'secretaa')

    expect(screen.getByLabelText('Al menos 8 caracteres: cumplido')).toBeTruthy()
    expect(screen.getByLabelText('Una letra minúscula: cumplido')).toBeTruthy()
    expect(screen.getByLabelText('Una letra mayúscula: pendiente')).toBeTruthy()
    expect(screen.getByLabelText('Un número: pendiente')).toBeTruthy()

    await fireEvent.changeText(screen.getByLabelText('Contraseña'), STRONG)

    expect(screen.getByLabelText('Una letra mayúscula: cumplido')).toBeTruthy()
    expect(screen.getByLabelText('Un número: cumplido')).toBeTruthy()
    expect(screen.getByLabelText('Un símbolo: cumplido')).toBeTruthy()
  })

  it('no deja enviar mientras no se aceptan los términos', async () => {
    const register = registerThatReturns(ok('u-nuevo'))
    await renderWithContainer(<RegisterScreen />, { register: register as never })

    await fillForm()
    await fireEvent.press(screen.getByText('Crear cuenta'))
    expect(register.execute).not.toHaveBeenCalled()

    await fireEvent.press(screen.getByLabelText(TERMS))
    await fireEvent.press(screen.getByText('Crear cuenta'))

    await waitFor(() => expect(register.execute).toHaveBeenCalledTimes(1))
  })

  it('da de alta la cuenta y lleva a la activación', async () => {
    const register = registerThatReturns(ok('u-nuevo'))
    await renderWithContainer(<RegisterScreen />, { register: register as never })

    await fillForm()
    await fireEvent.press(screen.getByLabelText(TERMS))
    await fireEvent.press(screen.getByLabelText(MARKETING))
    await fireEvent.press(screen.getByText('Crear cuenta'))

    await waitFor(() =>
      expect(register.execute).toHaveBeenCalledWith({
        email: 'ana@nx036.com',
        password: STRONG,
        firstName: 'Ana',
        companyName: 'Nexa',
        country: expect.anything(),
        language: expect.anything(),
        acceptedTerms: true,
        marketingOptIn: true,
      }),
    )
    expect(global.routerMock.replace).toHaveBeenCalledWith('/activate')
  })

  it('omite los campos opcionales que se dejan en blanco', async () => {
    const register = registerThatReturns(ok('u-nuevo'))
    await renderWithContainer(<RegisterScreen />, { register: register as never })

    await fireEvent.changeText(screen.getByLabelText('Correo electrónico'), 'ana@nx036.com')
    await fireEvent.changeText(screen.getByLabelText('Contraseña'), STRONG)
    await fireEvent.changeText(screen.getByLabelText('País'), '')
    await fireEvent.changeText(screen.getByLabelText('Idioma'), '')
    await fireEvent.press(screen.getByLabelText(TERMS))
    await fireEvent.press(screen.getByText('Crear cuenta'))

    await waitFor(() =>
      expect(register.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          firstName: undefined,
          companyName: undefined,
          country: undefined,
          language: undefined,
          marketingOptIn: false,
        }),
      ),
    )
  })

  it('muestra el error del backend tal cual llega', async () => {
    const register = registerThatReturns(
      err(new AppError('CONFLICT', 'Ya existe una cuenta con ese correo.')),
    )
    await renderWithContainer(<RegisterScreen />, { register: register as never })

    await fillForm()
    await fireEvent.press(screen.getByLabelText(TERMS))
    await fireEvent.press(screen.getByText('Crear cuenta'))

    expect(await screen.findByText('Ya existe una cuenta con ese correo.')).toBeTruthy()
    expect(global.routerMock.replace).not.toHaveBeenCalled()
  })

  it('vuelve al acceso desde el pie del formulario', async () => {
    await renderWithContainer(<RegisterScreen />, { register: registerThatReturns() as never })

    await fireEvent.press(screen.getByText('Iniciar sesión'))

    expect(global.routerMock.push).toHaveBeenCalledWith('/login')
  })
})
