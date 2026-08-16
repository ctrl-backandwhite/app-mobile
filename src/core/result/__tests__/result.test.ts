import { err, isErr, isOk, ok } from '../result'

describe('Result', () => {
  it('envuelve un valor correcto', () => {
    const result = ok(42)

    expect(result).toEqual({ ok: true, value: 42 })
    expect(isOk(result)).toBe(true)
  })

  it('envuelve un fallo', () => {
    const result = err(new Error('roto'))

    expect(result.ok).toBe(false)
    expect(isErr(result)).toBe(true)
  })

  it('estrecha el tipo al comprobar el éxito', () => {
    const result = ok('hola') as ReturnType<typeof ok<string>> | ReturnType<typeof err<Error>>

    expect(isOk(result) ? result.value : null).toBe('hola')
  })
})
