import { AxiosError, AxiosResponse } from 'axios'

import { mapHttpError } from '../http-error-mapper'

function axiosErrorWith(status: number, data: unknown): AxiosError {
  const error = new AxiosError('fallo')
  error.response = { status, data } as AxiosResponse
  return error
}

describe('mapHttpError', () => {
  it('traduce el 401 con MFA_REQUIRED', () => {
    expect(mapHttpError(axiosErrorWith(401, { code: 'MFA_REQUIRED' })).code).toBe('MFA_REQUIRED')
  })

  it('traduce el 401 con MFA_INVALID', () => {
    expect(mapHttpError(axiosErrorWith(401, { code: 'MFA_INVALID' })).code).toBe('MFA_INVALID')
  })

  it('traduce el 401 sin código como credenciales incorrectas', () => {
    expect(mapHttpError(axiosErrorWith(401, {})).code).toBe('INVALID_CREDENTIALS')
  })

  it('traduce el 429 como limitación por frecuencia', () => {
    expect(mapHttpError(axiosErrorWith(429, {})).code).toBe('RATE_LIMITED')
  })

  it('conserva el mensaje que ya viene traducido del backend', () => {
    const result = mapHttpError(axiosErrorWith(400, { message: 'Correo ya registrado' }))

    expect(result.message).toBe('Correo ya registrado')
    expect(result.code).toBe('VALIDATION')
  })

  it('traduce la ausencia de respuesta como fallo de red', () => {
    expect(mapHttpError(new AxiosError('Network Error')).code).toBe('NETWORK')
  })

  it('traduce el 500 como fallo del servidor', () => {
    expect(mapHttpError(axiosErrorWith(500, {})).code).toBe('SERVER')
  })

  it('reconoce el fallo del CAPTCHA por su código', () => {
    expect(mapHttpError(axiosErrorWith(400, { code: 'CAPTCHA_FAILED' })).code).toBe('CAPTCHA_FAILED')
  })

  it('conserva el estado HTTP para poder diagnosticar', () => {
    expect(mapHttpError(axiosErrorWith(409, {})).status).toBe(409)
  })

  it('devuelve tal cual un error que ya es de la aplicación', () => {
    const original = mapHttpError(axiosErrorWith(401, {}))

    expect(mapHttpError(original)).toBe(original)
  })
})
