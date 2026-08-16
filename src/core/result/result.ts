/**
 * Resultado explícito de una operación que puede fallar.
 *
 * Los casos de uso lo devuelven en lugar de lanzar: quien los consume distingue el éxito del fallo
 * sobre un valor, sin envolver cada llamada en try/catch ni adivinar qué excepciones pueden salir.
 */
export type Result<T, E> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: E }

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value }
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error }
}

export function isOk<T, E>(result: Result<T, E>): result is { readonly ok: true; readonly value: T } {
  return result.ok
}

export function isErr<T, E>(result: Result<T, E>): result is { readonly ok: false; readonly error: E } {
  return !result.ok
}
