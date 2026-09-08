import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { PushDevice, PushDeviceGateway, PushRegistry } from '../ports/push-registry'
import { DisablePushNotifications, EnablePushNotifications } from '../usecases/push'

const ESTE: PushDevice = { token: 'ExponentPushToken[abc]', platform: 'android' }

function telefono(device: PushDevice | null = ESTE): PushDeviceGateway {
  return { obtainToken: jest.fn().mockResolvedValue(device) }
}

function servidor(overrides: Partial<PushRegistry> = {}): PushRegistry {
  return {
    register: jest.fn().mockResolvedValue(ok(undefined)),
    unregister: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  }
}

describe('EnablePushNotifications', () => {
  it('apunta el dispositivo en el servidor', async () => {
    const registry = servidor()

    const result = await new EnablePushNotifications(telefono(), registry).execute()

    expect(registry.register).toHaveBeenCalledWith(ESTE)
    expect(result.ok && result.value).toBe(true)
  })

  /**
   * Que el teléfono no dé token es NORMAL: permiso denegado, emulador sin servicios de mensajería o
   * compilación sin credenciales. No es un fallo que enseñar —el buzón dentro de la app sigue
   * estando—, así que se responde «no activado» en vez de un error.
   */
  it('responde que no se ha activado cuando el teléfono no da token', async () => {
    const registry = servidor()

    const result = await new EnablePushNotifications(telefono(null), registry).execute()

    expect(result.ok && result.value).toBe(false)
    expect(registry.register).not.toHaveBeenCalled()
  })

  it('propaga el fallo del servidor', async () => {
    const result = await new EnablePushNotifications(
      telefono(),
      servidor({ register: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin red'))) }),
    ).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('DisablePushNotifications', () => {
  /**
   * Sin la baja, el siguiente aviso de la cuenta llegaría a un teléfono que ya no tiene su sesión —o
   * a manos ajenas si se prestó—, y un aviso lleva título y cuerpo.
   */
  it('retira el dispositivo del servidor', async () => {
    const registry = servidor()

    await new DisablePushNotifications(telefono(), registry).execute()

    expect(registry.unregister).toHaveBeenCalledWith(ESTE.token)
  })

  it('no llama al servidor si este teléfono no tenía token', async () => {
    const registry = servidor()

    const result = await new DisablePushNotifications(telefono(null), registry).execute()

    expect(result.ok).toBe(true)
    expect(registry.unregister).not.toHaveBeenCalled()
  })
})
