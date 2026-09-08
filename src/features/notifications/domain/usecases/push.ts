import { AppError } from '@core/errors/app-error'
import { ok, Result } from '@core/result/result'

import { PushDeviceGateway, PushRegistry } from '../ports/push-registry'

/**
 * Deja este teléfono apuntado para recibir avisos.
 *
 * <p>Devuelve si se ha conseguido. Que no se consiga es un caso NORMAL —permiso denegado, emulador
 * sin servicios de Google, compilación sin credenciales— y no un fallo que enseñar: el buzón dentro
 * de la aplicación sigue siendo la fuente de verdad y la tienda funciona igual.
 */
export class EnablePushNotifications {
  constructor(
    private readonly gateway: PushDeviceGateway,
    private readonly registry: PushRegistry,
  ) {}

  async execute(): Promise<Result<boolean, AppError>> {
    const device = await this.gateway.obtainToken()
    if (!device) return ok(false)

    const registered = await this.registry.register(device)
    if (!registered.ok) return registered
    return ok(true)
  }
}

/**
 * Retira este teléfono.
 *
 * <p>Se llama al CERRAR SESIÓN, y no es opcional: sin esto, el siguiente aviso de la cuenta anterior
 * llegaría al teléfono de quien ya no tiene la sesión abierta —o a manos ajenas, si el móvil se
 * prestó—. Un aviso lleva el título y el cuerpo, así que sería una fuga real.
 */
export class DisablePushNotifications {
  constructor(
    private readonly gateway: PushDeviceGateway,
    private readonly registry: PushRegistry,
  ) {}

  async execute(): Promise<Result<void, AppError>> {
    const device = await this.gateway.obtainToken()
    if (!device) return ok(undefined)
    return this.registry.unregister(device.token)
  }
}
