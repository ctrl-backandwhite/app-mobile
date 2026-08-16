import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

/** Cómo vuelve la persona de la pasarela externa. */
export type ApprovalOutcome = 'approved' | 'cancelled'

/**
 * Aprobación de un pago en la web del proveedor (PayPal).
 *
 * Se abre en la vista de navegador del sistema, no en una vista incrustada: la incrustada podría
 * leer las credenciales que se teclean y los proveedores las rechazan por eso mismo. El regreso se
 * reconoce por el enlace profundo de la aplicación.
 */
export interface PaymentApprovalGateway {
  approve(approvalUrl: string): Promise<Result<ApprovalOutcome, AppError>>
}
