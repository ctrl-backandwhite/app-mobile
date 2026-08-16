/** Motivos con los que el backend puede rechazar un acceso social; llegan como código en la URL. */
const RECHAZOS: Record<string, string> = {
  google_email_unverified: 'Google no ha confirmado que ese correo sea tuyo.',
  google_no_email: 'Tu cuenta de Google no ha compartido un correo con el que identificarte.',
  '2fa_required': 'Tu cuenta tiene verificación en dos pasos: entra con tu correo y contraseña.',
  google: 'No se ha podido completar el acceso con Google.',
}

const GENERICO = 'No se ha podido completar el acceso con Google.'

const LINK_REQUIRED =
  'Ya existe una cuenta con ese correo. Entra con tu contraseña una vez y quedará vinculada.'

export interface SocialCallback {
  readonly accessToken?: string
  readonly refreshToken?: string
  /** Texto listo para pintar cuando el acceso no se puede completar. */
  readonly rejection?: string
}

/**
 * Interpreta el enlace con el que el backend devuelve el control a la aplicación.
 *
 * Los tokens viajan en el FRAGMENTO (`#token=…`) y no en la parte de consulta: así no llegan al
 * servidor ni quedan en los registros de los proxys intermedios. Por eso hay que mirar la dirección
 * completa y no los parámetros de ruta, que solo cubren la consulta.
 *
 * Es una función pura para poder probar cada caso sin montar pantalla ni navegador.
 */
export function readSocialCallback(url: string | null | undefined): SocialCallback {
  if (!url) return {}

  if (url.includes('link=required')) return { rejection: LINK_REQUIRED }

  const error = /[?&]error=([^&#]+)/.exec(url)?.[1]
  if (error) {
    // Un motivo desconocido no puede dejar la pantalla muda: se explica en genérico.
    return { rejection: RECHAZOS[decodeURIComponent(error)] ?? GENERICO }
  }

  const fragment = url.split('#')[1]
  if (!fragment) return { rejection: 'El acceso no ha devuelto una sesión.' }

  const params = new URLSearchParams(fragment)
  const accessToken = params.get('token') ?? undefined
  const refreshToken = params.get('refresh') ?? undefined
  if (!accessToken || !refreshToken) {
    return { rejection: 'El acceso no ha devuelto una sesión completa.' }
  }

  return { accessToken, refreshToken }
}
