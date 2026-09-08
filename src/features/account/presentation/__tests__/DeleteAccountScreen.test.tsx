import { act, fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'

import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { useSessionStore } from '@features/auth/presentation/state/session.store'
import { aUser } from '@features/auth/domain/testing/fake-auth-repository'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'

import { DeleteAccountScreen } from '../screens/DeleteAccountScreen'

interface Dobles {
  requestAccountDeletion: { execute: jest.Mock }
  confirmAccountDeletion: { execute: jest.Mock }
}

function contenedor(
  peticion: Result<void, AppError> = ok(undefined),
  confirmacion: Result<void, AppError> = ok(undefined),
): Dobles {
  return {
    requestAccountDeletion: { execute: jest.fn().mockResolvedValue(peticion) },
    confirmAccountDeletion: { execute: jest.fn().mockResolvedValue(confirmacion) },
  }
}

async function pulsa(texto: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByText(texto))
  })
}

/**
 * Apple y Google exigen poder borrar la cuenta desde la propia aplicación para publicarla; remitir a
 * la web es motivo de rechazo en la revisión.
 */
describe('DeleteAccountScreen', () => {
  beforeEach(() => {
    useSessionStore.setState({ user: aUser(), status: 'authenticated' })
  })

  it('dice qué se pierde antes de dejar borrar nada', async () => {
    await renderCatalog(<DeleteAccountScreen />, contenedor() as never)

    expect(screen.getByText('Esta acción no se puede deshacer.')).toBeTruthy()
    expect(screen.getByText(/El saldo del monedero no se devuelve/)).toBeTruthy()
  })

  /**
   * Un botón que borra al primer toque es un accidente esperando a ocurrir: basta un teléfono
   * desbloqueado en manos ajenas. Primero se pide el código, y hasta entonces no hay campo que
   * rellenar.
   */
  it('no enseña el campo del código hasta haberlo pedido', async () => {
    await renderCatalog(<DeleteAccountScreen />, contenedor() as never)

    expect(screen.queryByTestId('codigo-borrado')).toBeNull()

    await pulsa('Enviarme el código de confirmación')

    expect(await screen.findByTestId('codigo-borrado')).toBeTruthy()
  })

  it('borra la cuenta con el código y devuelve al acceso', async () => {
    const deps = contenedor()
    await renderCatalog(<DeleteAccountScreen />, deps as never)

    await pulsa('Enviarme el código de confirmación')
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('codigo-borrado'), '123456')
    })
    await pulsa('Eliminar mi cuenta definitivamente')

    expect(deps.confirmAccountDeletion.execute).toHaveBeenCalledWith('123456')
    // La cuenta ya no existe: dejar el token en memoria apuntaría a un usuario borrado.
    expect(useSessionStore.getState().user).toBeNull()
    expect(router.replace).toHaveBeenCalledWith('/login')
  })

  it('enseña el motivo si el código no vale y NO cierra la sesión', async () => {
    await renderCatalog(
      <DeleteAccountScreen />,
      contenedor(ok(undefined), err(new AppError('VALIDATION', 'Código caducado.'))) as never,
    )

    await pulsa('Enviarme el código de confirmación')
    await act(async () => {
      fireEvent.changeText(screen.getByTestId('codigo-borrado'), '000000')
    })
    await pulsa('Eliminar mi cuenta definitivamente')

    expect(await screen.findByText('Código caducado.')).toBeTruthy()
    expect(useSessionStore.getState().user).not.toBeNull()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('avisa si no se ha podido enviar el código', async () => {
    await renderCatalog(
      <DeleteAccountScreen />,
      contenedor(err(new AppError('NETWORK', 'sin conexión'))) as never,
    )

    await pulsa('Enviarme el código de confirmación')

    expect(await screen.findByText('sin conexión')).toBeTruthy()
    expect(screen.queryByTestId('codigo-borrado')).toBeNull()
  })
})
