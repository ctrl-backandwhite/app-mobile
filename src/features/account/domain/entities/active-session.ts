/**
 * Una sesión abierta de la cuenta, tal y como la ve quien entra a revisarlas.
 *
 * <p>La lista existe para responder a una pregunta concreta: «¿hay alguien más dentro de mi cuenta?».
 * Por eso lleva el dispositivo, la IP y cuándo se vio por última vez, y por eso marca cuál es la de
 * este teléfono: sin esa marca, cerrar sesiones a ciegas acaba en cerrarse la propia.
 */
export interface ActiveSession {
  readonly id: string
  readonly device: string
  readonly ip: string
  readonly createdAt: string
  readonly lastSeenAt: string
  readonly current: boolean
}
