import { AppError } from '@core/errors/app-error'
import { mapHttpError } from '@core/errors/http-error-mapper'
import { err, ok, Result } from '@core/result/result'

/** Zod señala sus fallos con este nombre; comprobarlo evita acoplarse a la clase concreta. */
function isSchemaViolation(error: unknown): boolean {
  return error instanceof Error && error.name === 'ZodError'
}

/**
 * Envuelve una llamada al backend: traduce cualquier fallo a `AppError` y valida el contrato.
 *
 * Vive en un módulo compartido porque la compra habla con cinco endpoints distintos y repetir el
 * try/catch en cada uno acabaría con cinco tratamientos del error ligeramente distintos —que es
 * exactamente el sitio donde se cuelan los fallos que nadie ve hasta que alguien paga.
 */
export async function call<T>(
  operation: () => Promise<unknown>,
  parse: (raw: unknown) => T,
  contractMessage = 'La respuesta del servidor no tiene el formato esperado.',
): Promise<Result<T, AppError>> {
  try {
    return ok(parse(await operation()))
  } catch (error) {
    if (isSchemaViolation(error)) return err(new AppError('CONTRACT', contractMessage))
    return err(mapHttpError(error))
  }
}
