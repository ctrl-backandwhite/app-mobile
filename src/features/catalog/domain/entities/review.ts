import { Page } from './page'

/**
 * Opinión sobre un producto. Las hay importadas del proveedor y escritas en la plataforma, pero la
 * ficha las pinta igual, así que el origen no se trae.
 */
export interface Review {
  readonly id: string
  readonly rating: number
  readonly title?: string
  readonly body?: string
  readonly authorName?: string
  /** Fecha en ISO-8601 tal y como la manda el backend; la app no la reinterpreta. */
  readonly createdAt?: string
}

export type ReviewPage = Page<Review>
