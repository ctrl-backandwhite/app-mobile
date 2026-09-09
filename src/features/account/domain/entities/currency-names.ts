/**
 * Cómo se llama cada divisa en español.
 *
 * <p>El backend sirve el nombre SIEMPRE en inglés —«UAE Dirham», «Chinese Yuan»—, mande el idioma
 * que mande la petición, así que el selector de divisa era el único sitio de la aplicación escrito
 * en otro idioma. Traducirlo en el servidor obligaría a mantener una tabla de treinta divisas por
 * ocho idiomas para un texto que solo se lee al elegir; aquí basta con una lista.
 *
 * <p>Una divisa que no esté en la lista se queda con el nombre que mande el servidor: es preferible
 * a dejar el hueco, y así una divisa nueva aparece el día que se publica sin esperar a la app.
 */
const NOMBRES: Readonly<Record<string, string>> = {
  AED: 'Dírham emiratí',
  ARS: 'Peso argentino',
  AUD: 'Dólar australiano',
  BRL: 'Real brasileño',
  CAD: 'Dólar canadiense',
  CHF: 'Franco suizo',
  CLP: 'Peso chileno',
  CNY: 'Yuan chino',
  COP: 'Peso colombiano',
  DKK: 'Corona danesa',
  EUR: 'Euro',
  GBP: 'Libra esterlina',
  HKD: 'Dólar de Hong Kong',
  INR: 'Rupia india',
  JPY: 'Yen japonés',
  KRW: 'Won surcoreano',
  MXN: 'Peso mexicano',
  NOK: 'Corona noruega',
  PEN: 'Sol peruano',
  PLN: 'Esloti polaco',
  SEK: 'Corona sueca',
  SGD: 'Dólar de Singapur',
  TRY: 'Lira turca',
  USD: 'Dólar estadounidense',
  ZAR: 'Rand sudafricano',
}

export function currencyName(code: string, fallback: string): string {
  return NOMBRES[code.toUpperCase()] ?? fallback
}
