import * as Linking from 'expo-linking'

/**
 * Guarda el enlace de vuelta del acceso social en cuanto el sistema lo entrega.
 *
 * No puede escucharlo la pantalla que lo necesita. Cuando Android entrega el enlace a una aplicación
 * que ya está viva, el evento se emite una sola vez y quien está suscrito desde el arranque
 * —expo-router— lo consume para navegar; la pantalla de destino se monta DESPUÉS, registra su
 * escucha y el evento ya ha pasado. `getInitialURL()` tampoco la salva: devuelve el enlace con el que
 * arrancó la aplicación, que es el del lanzador. El resultado era una espera eterna después de
 * haberse identificado correctamente.
 *
 * Por eso la escucha se instala al arrancar, antes de que se pinte nada, y el enlace queda aquí
 * hasta que alguien venga a por él.
 */

type Listener = () => void

let captured: string | null = null
let subscription: { remove(): void } | null = null
const listeners = new Set<Listener>()

/** Solo interesa la vuelta del acceso: el resto de enlaces los encamina expo-router por su cuenta. */
function isAuthCallback(url: string | null | undefined): url is string {
  return Boolean(url?.includes('auth/callback'))
}

function accept(url: string | null | undefined): void {
  if (!isAuthCallback(url)) return
  captured = url
  listeners.forEach((listener) => listener())
}

/** Instala la escucha. Es idempotente: llamarla de más no duplica suscripciones. */
export function startCapturingIncomingLinks(): void {
  if (subscription) return
  subscription = Linking.addEventListener('url', (event) => accept(event.url))
  // Cubre el arranque en frío, cuando el enlace abre la aplicación y no hay evento que escuchar.
  Linking.getInitialURL()
    .then(accept)
    .catch(() => undefined)
}

export function capturedAuthLink(): string | null {
  return captured
}

/** Se suscribe a la llegada del enlace y devuelve la función para darse de baja. */
export function onAuthLink(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Deja el módulo como recién importado. Existe para las pruebas, que comparten proceso. */
export function resetIncomingLinks(): void {
  captured = null
  subscription?.remove()
  subscription = null
  listeners.clear()
}
