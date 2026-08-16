// En @noble/hashes 2.x el mapa de `exports` solo publica las rutas con extensión («./sha2.js»),
// así que el especificador sin extensión que usaba la versión 1 ya no resuelve.
import { sha256 } from '@noble/hashes/sha2.js'
import { bytesToHex } from '@noble/hashes/utils.js'
import { AppError } from '@core/errors/app-error'

/** Reto que emite el servidor ALTCHA. Los nombres son los del protocolo, no se renombran. */
export interface Challenge {
  algorithm: string
  challenge: string
  maxnumber: number
  salt: string
  signature: string
}

/** Puerto que consume el dominio: resuelve la prueba y devuelve el valor de la cabecera X-Altcha. */
export interface CaptchaSolver {
  solve(): Promise<string>
}

const BATCH = 2000

const BASE64_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function hashOf(encoder: TextEncoder, salt: string, n: number): string {
  return bytesToHex(sha256(encoder.encode(salt + n)))
}

/**
 * Codifica en base64 sin `Buffer` ni `btoa`.
 *
 * `Buffer` es de Node y **no existe en Hermes**, el motor que ejecuta la app en el dispositivo: usarlo
 * funcionaría en las pruebas —que corren sobre Node— y reventaría en producción. `btoa` tampoco está
 * garantizado. Son doce líneas y evitan un polirelleno para un solo uso.
 */
function toBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] as number
    const b1 = i + 1 < bytes.length ? (bytes[i + 1] as number) : 0
    const b2 = i + 2 < bytes.length ? (bytes[i + 2] as number) : 0
    const triple = (b0 << 16) | (b1 << 8) | b2
    out += BASE64_ALPHABET[(triple >> 18) & 63]
    out += BASE64_ALPHABET[(triple >> 12) & 63]
    out += i + 1 < bytes.length ? BASE64_ALPHABET[(triple >> 6) & 63] : '='
    out += i + 2 < bytes.length ? BASE64_ALPHABET[triple & 63] : '='
  }
  return out
}

/**
 * Prueba de trabajo del protocolo ALTCHA. El widget del navegador usa `crypto.subtle`, que en React
 * Native no existe: aquí se calcula el SHA-256 en JavaScript puro.
 *
 * El reto solo dice cuál es el hash; hay que dar con el número por fuerza bruta. El bucle se trocea
 * y cede el hilo entre lotes porque JavaScript es de un solo hilo: sin la pausa, resolver un reto
 * grande congelaría la interfaz hasta terminar.
 */
export class AltchaCaptchaSolver implements CaptchaSolver {
  constructor(private readonly fetchChallenge: () => Promise<Challenge>) {}

  async solve(): Promise<string> {
    const challenge = await this.fetchChallenge()
    const encoder = new TextEncoder()
    let found = -1

    for (let start = 0; start <= challenge.maxnumber && found < 0; start += BATCH) {
      const end = Math.min(start + BATCH - 1, challenge.maxnumber)
      for (let n = start; n <= end; n++) {
        if (hashOf(encoder, challenge.salt, n) === challenge.challenge) {
          found = n
          break
        }
      }
      if (found < 0) await new Promise((resolve) => setTimeout(resolve, 0))
    }

    if (found < 0) {
      throw new AppError('CAPTCHA_FAILED', 'No se pudo completar la verificación de seguridad.')
    }

    const payload = {
      algorithm: challenge.algorithm,
      challenge: challenge.challenge,
      number: found,
      salt: challenge.salt,
      signature: challenge.signature,
    }
    return toBase64(encoder.encode(JSON.stringify(payload)))
  }
}
