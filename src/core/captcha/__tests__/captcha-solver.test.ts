import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { AltchaCaptchaSolver, Challenge } from '../captcha-solver'

function challengeForNumber(n: number, maxnumber = 5000): Challenge {
  const salt = 'sal-de-prueba'
  return {
    algorithm: 'SHA-256',
    challenge: bytesToHex(sha256(new TextEncoder().encode(salt + n))),
    maxnumber,
    salt,
    signature: 'firma',
  }
}

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

/**
 * Decodifica sin `Buffer` a propósito: es de Node y no existe en Hermes. Si la prueba usara la
 * comodidad de Node, no detectaría que la implementación se apoya en algo ausente en el dispositivo.
 */
function decode(payload: string): Record<string, unknown> {
  const clean = payload.replace(/=+$/, '')
  let bits = 0
  let acc = 0
  const bytes: number[] = []
  for (const char of clean) {
    acc = (acc << 6) | BASE64_ALPHABET.indexOf(char)
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((acc >> bits) & 0xff)
    }
  }
  return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes))) as Record<string, unknown>
}

describe('AltchaCaptchaSolver', () => {
  it('encuentra el número del reto y devuelve el payload en base64', async () => {
    const challenge = challengeForNumber(1234)
    const solver = new AltchaCaptchaSolver(async () => challenge)

    const payload = await solver.solve()

    const decoded = decode(payload)
    expect(decoded.number).toBe(1234)
    expect(decoded.algorithm).toBe('SHA-256')
    expect(decoded.challenge).toBe(challenge.challenge)
    expect(decoded.salt).toBe(challenge.salt)
    expect(decoded.signature).toBe('firma')
  })

  it('resuelve el número cero', async () => {
    const solver = new AltchaCaptchaSolver(async () => challengeForNumber(0))

    expect(decode(await solver.solve()).number).toBe(0)
  })

  // El límite del lote es donde se cede el hilo: un número más allá comprueba que la reanudación no
  // se salta candidatos ni repite el primero del lote siguiente.
  it('resuelve un número más allá del primer lote', async () => {
    const solver = new AltchaCaptchaSolver(async () => challengeForNumber(2500, 6000))

    expect(decode(await solver.solve()).number).toBe(2500)
  })

  it('resuelve el número igual a maxnumber, que es un candidato válido', async () => {
    const solver = new AltchaCaptchaSolver(async () => challengeForNumber(300, 300))

    expect(decode(await solver.solve()).number).toBe(300)
  })

  it('falla con CAPTCHA_FAILED cuando el reto no tiene solución', async () => {
    const imposible: Challenge = {
      algorithm: 'SHA-256',
      challenge: 'ffff',
      maxnumber: 50,
      salt: 's',
      signature: 'f',
    }
    const solver = new AltchaCaptchaSolver(async () => imposible)

    await expect(solver.solve()).rejects.toMatchObject({ code: 'CAPTCHA_FAILED' })
  })

  it('propaga el fallo si no se puede pedir el reto', async () => {
    const solver = new AltchaCaptchaSolver(async () => {
      throw new Error('sin red')
    })

    await expect(solver.solve()).rejects.toThrow('sin red')
  })

  it('pide un reto nuevo en cada intento, porque el servidor no los reutiliza', async () => {
    let veces = 0
    const solver = new AltchaCaptchaSolver(async () => {
      veces++
      return challengeForNumber(7)
    })

    await solver.solve()
    await solver.solve()

    expect(veces).toBe(2)
  })
})
