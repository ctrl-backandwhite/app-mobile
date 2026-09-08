import * as WebBrowser from 'expo-web-browser'

import { AppError } from '@core/errors/app-error'
import { logger } from '@core/logger/logger'
import { err, ok, Result } from '@core/result/result'
import {
  ApprovalOutcome,
  PaymentApprovalGateway,
} from '@features/checkout/domain/ports/payment-approval-gateway'

/**
 * Prefijo de vuelta del pago. La vista de navegador se cierra sola en cuanto la navegación llega a
 * una dirección que empiece por aquí, y el backend tiene configuradas dos que lo comparten:
 * `nx036://pago/retorno` cuando se aprueba y `nx036://pago/cancelado` cuando no.
 *
 * Antes se pasaba el enlace del ACCESO (`nx036://auth/callback`), que el pago no usa nunca: la
 * vista no se cerraba jamás sola.
 */
const CALLBACK_URL = 'nx036://pago'

/** Ruta con la que el backend marca que se ha salido de la pasarela sin pagar. */
const CANCELADO = '/cancelado'

/**
 * Aprobación de un pago en la web del proveedor.
 *
 * Se abre en la vista de navegador del sistema: una vista incrustada
 * podría leer las credenciales que se teclean, y los proveedores de pago las rechazan por eso.
 *
 * Lo usan el pago de un pedido con PayPal y la recarga del monedero.
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

    // Las dos vueltas cierran la vista, así que el tipo de resultado no distingue: hay que mirar a
    // cuál se ha vuelto. Sin esto, cancelar en PayPal se leería como pagado.
    if (result.url.includes(CANCELADO)) return ok('cancelled')

    // Que el proveedor haya devuelto a la aplicación NO significa que el dinero se haya movido: el
    // cobro lo confirma el backend contra la pasarela. Aquí solo se informa de que la persona volvió.
    return ok('approved')
  }
}
