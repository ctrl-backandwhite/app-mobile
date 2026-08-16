import { AppError } from '@core/errors/app-error'
import { Result } from '@core/result/result'

/**
 * Alta de una tarjeta contra la pasarela.
 *
 * El número de tarjeta NO aparece en la firma y no es un descuido: lo custodia el formulario del
 * SDK, que lo manda directamente a la pasarela. Si viajara por aquí, el dominio y toda la
 * aplicación entrarían en el alcance de PCI-DSS.
 */
export interface CardSetupGateway {
  confirmSetup(clientSecret: string, holderName: string): Promise<Result<void, AppError>>
}
