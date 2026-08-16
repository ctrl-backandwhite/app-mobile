import { readConfig } from '../env'

describe('readConfig', () => {
  it('normaliza la barra final de la URL del backend', () => {
    const config = readConfig({ EXPO_PUBLIC_API_BASE_URL: 'https://api.nx036.com//' })

    expect(config.apiBaseUrl).toBe('https://api.nx036.com')
  })

  it('aplica los valores por defecto de divisa e idioma', () => {
    const config = readConfig({ EXPO_PUBLIC_API_BASE_URL: 'https://api.nx036.com' })

    expect(config.defaultCurrency).toBe('USD')
    expect(config.defaultLocale).toBe('es')
  })

  it('respeta la divisa y el idioma configurados', () => {
    const config = readConfig({
      EXPO_PUBLIC_API_BASE_URL: 'https://api.nx036.com',
      EXPO_PUBLIC_DEFAULT_CURRENCY: 'EUR',
      EXPO_PUBLIC_DEFAULT_LOCALE: 'pt',
    })

    expect(config.defaultCurrency).toBe('EUR')
    expect(config.defaultLocale).toBe('pt')
  })

  it('rechaza la falta de URL del backend', () => {
    expect(() => readConfig({})).toThrow(/EXPO_PUBLIC_API_BASE_URL/)
  })
})
