import { act, fireEvent, screen } from '@testing-library/react-native'
import { router } from 'expo-router'

import { AppError } from '@core/errors/app-error'
import { err, ok, Result } from '@core/result/result'
import { ActiveSession } from '@features/account/domain/entities/active-session'
import { renderCatalog } from '@features/catalog/presentation/testing/render-catalog'

import { SecurityScreen } from '../screens/SecurityScreen'

const BUENA = 'Abcdef1!'

const ESTA: ActiveSession = {
  id: 's-1',
  device: 'Pixel 8',
  ip: '10.0.0.1',
  createdAt: '2026-09-01T10:00:00Z',
  lastSeenAt: '2026-09-06T10:00:00Z',
  current: true,
}

const OTRA: ActiveSession = { ...ESTA, id: 's-2', device: 'Chrome en Windows', current: false }

interface Dobles {
  changePassword: { execute: jest.Mock }
  listSessions: { execute: jest.Mock }
  revokeSession: { execute: jest.Mock }
}

function contenedor(
  sesiones: Result<ActiveSession[], AppError> = ok([ESTA, OTRA]),
  cambio: Result<void, AppError> = ok(undefined),
): Dobles {
  return {
    changePassword: { execute: jest.fn().mockResolvedValue(cambio) },
    listSessions: { execute: jest.fn().mockResolvedValue(sesiones) },
    revokeSession: { execute: jest.fn().mockResolvedValue(ok(undefined)) },
  }
}

async function escribe(testID: string, valor: string): Promise<void> {
  await act(async () => {
    fireEvent.changeText(screen.getByTestId(testID), valor)
  })
}

async function pulsa(texto: string): Promise<void> {
  await act(async () => {
    fireEvent.press(screen.getByText(texto))
  })
}

/**
 * La contraseña y las sesiones viven en la misma pantalla porque se usan juntas: quien sospecha que
 * alguien ha entrado en su cuenta cierra la sesión ajena y cambia la contraseña, en ese orden.
 */
describe('SecurityScreen', () => {
  it('no deja guardar hasta que la contraseña cumple y coincide', async () => {
    const deps = contenedor()
    await renderCatalog(<SecurityScreen />, deps as never)

    await escribe('contrasena-actual', 'Vieja1!x')
    await escribe('contrasena-nueva', 'corta')
    await escribe('contrasena-repetida', 'corta')
    await pulsa('Guardar contraseña')

    expect(deps.changePassword.execute).not.toHaveBeenCalled()
  })

  it('avisa cuando las dos nuevas no coinciden', async () => {
    await renderCatalog(<SecurityScreen />, contenedor() as never)

    await escribe('contrasena-nueva', BUENA)
    await escribe('contrasena-repetida', 'Otra1!xy')

    expect(screen.getByText('Las dos contraseñas no coinciden.')).toBeTruthy()
  })

  it('cambia la contraseña y lo confirma', async () => {
    const deps = contenedor()
    await renderCatalog(<SecurityScreen />, deps as never)

    await escribe('contrasena-actual', 'Vieja1!x')
    await escribe('contrasena-nueva', BUENA)
    await escribe('contrasena-repetida', BUENA)
    await pulsa('Guardar contraseña')

    expect(deps.changePassword.execute).toHaveBeenCalledWith('Vieja1!x', BUENA)
    expect(await screen.findByText('Contraseña actualizada.')).toBeTruthy()
  })

  it('enseña el motivo cuando el backend rechaza el cambio', async () => {
    await renderCatalog(
      <SecurityScreen />,
      contenedor(ok([]), err(new AppError('INVALID_CREDENTIALS', 'La contraseña actual no coincide.'))) as never,
    )

    await escribe('contrasena-actual', 'Vieja1!x')
    await escribe('contrasena-nueva', BUENA)
    await escribe('contrasena-repetida', BUENA)
    await pulsa('Guardar contraseña')

    expect(await screen.findByText('La contraseña actual no coincide.')).toBeTruthy()
  })

  it('lista las sesiones abiertas', async () => {
    await renderCatalog(<SecurityScreen />, contenedor() as never)

    expect(await screen.findByText('Pixel 8')).toBeTruthy()
    expect(screen.getByText('Chrome en Windows')).toBeTruthy()
  })

  /** Un botón que expulsa a quien lo pulsa se lee como un fallo: para eso está «Cerrar sesión». */
  it('no ofrece cerrar la sesión de este teléfono', async () => {
    await renderCatalog(<SecurityScreen />, contenedor() as never)

    await screen.findByText('Pixel 8')
    expect(screen.getByText('Este dispositivo')).toBeTruthy()
    expect(screen.queryByTestId('cerrar-sesion-s-1')).toBeNull()
    expect(screen.getByTestId('cerrar-sesion-s-2')).toBeTruthy()
  })

  it('cierra una sesión ajena', async () => {
    const deps = contenedor()
    await renderCatalog(<SecurityScreen />, deps as never)

    await screen.findByText('Chrome en Windows')
    await act(async () => {
      fireEvent.press(screen.getByTestId('cerrar-sesion-s-2'))
    })

    expect(deps.revokeSession.execute).toHaveBeenCalledWith('s-2')
    // Se relee la lista en vez de quitar la fila a mano: si el backend no la cerró, enseñarla como
    // cerrada dejaría a alguien tranquilo con una sesión ajena todavía abierta.
    expect(deps.listSessions.execute).toHaveBeenCalledTimes(2)
  })

  it('avisa si las sesiones no se pueden cargar', async () => {
    await renderCatalog(
      <SecurityScreen />,
      contenedor(err(new AppError('NETWORK', 'sin conexión'))) as never,
    )

    expect(await screen.findByText('No se han podido cargar tus sesiones.')).toBeTruthy()
  })

  it('lleva al borrado de cuenta', async () => {
    await renderCatalog(<SecurityScreen />, contenedor() as never)

    await act(async () => {
      fireEvent.press(screen.getByTestId('ir-a-borrar-cuenta'))
    })

    expect(router.push).toHaveBeenCalledWith('/settings/delete-account')
  })
})
