import { logger } from '../logger'

describe('logger', () => {
  const spies = {
    log: jest.spyOn(console, 'log').mockImplementation(() => undefined),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => undefined),
    error: jest.spyOn(console, 'error').mockImplementation(() => undefined),
  }

  beforeEach(() => jest.clearAllMocks())
  afterAll(() => jest.restoreAllMocks())

  it('encamina cada nivel a su salida de consola', () => {
    logger.debug('depuración')
    logger.info('información')
    logger.warn('aviso')
    logger.error('fallo')

    expect(spies.log).toHaveBeenCalledTimes(2)
    expect(spies.warn).toHaveBeenCalledTimes(1)
    expect(spies.error).toHaveBeenCalledTimes(1)
  })

  it('marca las líneas con el prefijo del proyecto y el nivel', () => {
    logger.warn('algo raro')

    expect(spies.warn).toHaveBeenCalledWith('::> [WARN] algo raro', '')
  })

  it('adjunta el detalle cuando se aporta', () => {
    const detalle = { causa: 'sin red' }

    logger.error('no se pudo renovar', detalle)

    expect(spies.error).toHaveBeenCalledWith('::> [ERROR] no se pudo renovar', detalle)
  })
})
