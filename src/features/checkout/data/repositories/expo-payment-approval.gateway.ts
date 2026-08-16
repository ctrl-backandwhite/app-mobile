import * as WebBrowser from 'expo-web-browser'

import { AppError } from '@core/errors/app-error'
import { logger } from '@core/logger/logger'
import { err, ok, Result } from '@core/result/result'
import {
  ApprovalOutcome,
  PaymentApprovalGateway,
} from '@features/checkout/domain/ports/payment-approval-gateway'

/** Enlace profundo que el backend tiene configurado como destino de esta aplicación. */
const CALLBACK_URL = 'nx036://auth/callback'

/**
 * Aprobación de un pago en la web del proveedor.
 *
 * Se abre en la vista de navegador del sistema, igual que el acceso con Google: una vista incrustada
 * podría leer las credenciales que se teclean, y los proveedores de pago las rechazan por eso.
 *
 * PENDIENTE DE ESTRENO: hoy la tramitación no devuelve ningún enlace de aprobación, así que nadie
 * llama a este puerta de enlace. Está aquí —y probada— para que el día que el backend publique ese
 * enlace en la respuesta del pedido, el pago con PayPal funcione sin más cambios.
 */
export class ExpoPaymentApprovalGateway implements PaymentApprovalGateway {
  async approve(approvalUrl: string): Promise<Result<ApprovalOutcome, AppError>> {
    if (!/^https?:\/\//i.test(approvalUrl)) {
      // Una dirección que no es del proveedor no se abre: sería un redirector abierto hacia
      // cualquier página que supiera imitar la pasarela.
      return err(new AppError('VALIDATION', 'El enlace de pago recibido no es válido.'))
    }

    let result: WebBrowser.WebBrowserAuthSessionResult
    try {
      result = await WebBrowser.openAuthSessionAsync(approvalUrl, CALLBACK_URL)
    } catch (error) {
      logger.warn('No se pudo abrir el navegador para aprobar el pago', error)
      return err(new AppError('UNKNOWN', 'No se ha podido abrir la pasarela de pago.'))
    }

    // Cerrar la pestaña o pulsar atrás no es un fallo: es alguien que ha decidido no pagar todavía.
    if (result.type !== 'success') return ok('cancelled')

    // Que el proveedor haya devuelto a la aplicación NO significa que el dinero se haya movido: el
    // cobro lo confirma el backend contra la pasarela. Aquí solo se informa de que la persona volvió.
    return ok('approved')
  }
}
