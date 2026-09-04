/**
 * Versión de los documentos legales que la aplicación muestra al registrarse.
 *
 * El backend la exige desde el 15 de agosto de 2026 y la rechaza vacía: sin ella el alta devuelve un
 * 400 y nadie puede crear una cuenta desde el móvil. La app no la enviaba, así que el registro llevaba
 * tres semanas roto.
 *
 * El valor NO se pide al servidor a propósito. Lo que hay que dejar registrado es la versión que el
 * usuario tuvo delante cuando marcó la casilla; preguntarla al enviar guardaría la versión vigente en
 * ese instante, que puede ser otra, y el consentimiento dejaría de corresponderse con lo aceptado.
 *
 * Al publicar una revisión de los términos hay que subir esta fecha a la vez que la de la web
 * (`LEGAL_UPDATED` en `frontend/src/content/legalPages.ts`): son el mismo documento.
 */
export const LEGAL_VERSION = '2026-08-15'

/** Documentos legales, en la web. Se abren en el navegador porque la app no los duplica. */
export const LEGAL_LINKS = {
  terminos: '/legal/terms',
  privacidad: '/legal/privacy',
} as const
