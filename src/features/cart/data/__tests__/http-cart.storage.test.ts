import MockAdapter from 'axios-mock-adapter'

import { HttpClient } from '@core/http/http-client'
import { CartLine } from '@features/cart/domain/entities/cart-line'

import { HttpCartStorage } from '../repositories/http-cart.storage'
import { SessionAwareCartStorage } from '../repositories/session-aware-cart.storage'

function makeClient(): { client: HttpClient; mock: MockAdapter } {
  const client = new HttpClient('https://api.test', {
    getAccessToken: () => 'token',
    getRefreshToken: () => null,
    onRefreshed: () => undefined,
    onExpired: () => undefined,
    getCountry: () => null,
    getLocale: () => 'es',
    getCurrency: () => 'EUR',
  })
  return { client, mock: new MockAdapter(client.raw) }
}

function line(overrides: Partial<CartLine> = {}): CartLine {
  return {
    productId: 'p-1',
    slug: 'camisa',
    title: 'Camisa',
    quantity: 2,
    ...overrides,
  }
}

const REMOTE = [{ productId: 'p-1', slug: 'camisa', title: 'Camisa', quantity: 2 }]

describe('HttpCartStorage', () => {
  it('lee la cesta de la cuenta', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').reply(200, REMOTE)

    const lines = await new HttpCartStorage(client).load()

    expect(lines).toHaveLength(1)
    expect(lines[0]?.title).toBe('Camisa')
  })

  it('devuelve una cesta vacía si el servidor no responde, sin impedir abrir la app', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').networkError()

    expect(await new HttpCartStorage(client).load()).toEqual([])
  })

  it('envía solo las líneas que cambian, no la cesta entera', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').reply(200, REMOTE)
    const puestas: unknown[] = []
    mock.onPut('/me/cart').reply((config) => {
      puestas.push(JSON.parse(config.data as string))
      return [200, []]
    })
    const storage = new HttpCartStorage(client)
    await storage.load()

    await storage.save([line({ quantity: 5 }), line({ productId: 'p-2', title: 'Botas' })])

    // La que no cambió no se reenvía: subir la cesta entera en cada pulsación multiplicaría las
    // llamadas sin motivo.
    expect(puestas).toHaveLength(2)
  })

  it('quita del servidor lo que ya no está en la cesta', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').reply(200, REMOTE)
    const borradas: string[] = []
    mock.onDelete(/\/me\/cart\/.+/).reply((config) => {
      borradas.push(config.url ?? '')
      return [200, []]
    })
    const storage = new HttpCartStorage(client)
    await storage.load()

    await storage.save([])

    expect(borradas).toEqual(['/me/cart/p-1'])
  })

  it('no da por sincronizado un guardado que falló', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').reply(200, [])
    mock.onPut('/me/cart').networkError()
    const storage = new HttpCartStorage(client)
    await storage.load()

    await expect(storage.save([line()])).rejects.toBeDefined()

    // Al reintentar vuelve a enviarse: si se hubiera marcado como sincronizada, la línea se habría
    // perdido en silencio.
    mock.onPut('/me/cart').reply(200, [])
    await expect(storage.save([line()])).resolves.toBeUndefined()
  })
})

describe('SessionAwareCartStorage', () => {
  function doble() {
    return {
      lines: [] as CartLine[],
      load: jest.fn(async function (this: { lines: CartLine[] }) {
        return this.lines
      }),
      save: jest.fn(async () => undefined),
      clear: jest.fn(async () => undefined),
    }
  }

  it('usa el dispositivo mientras no hay sesión', async () => {
    const local = doble()
    const remote = doble()
    const storage = new SessionAwareCartStorage(local, remote, () => false)

    await storage.save([line()])

    expect(local.save).toHaveBeenCalled()
    expect(remote.save).not.toHaveBeenCalled()
  })

  it('usa el servidor en cuanto hay sesión, aunque la app ya estuviera abierta', async () => {
    // La decisión se toma en cada operación: tomarla al construir dejaría a quien acaba de entrar
    // escribiendo en la cesta del invitado.
    const local = doble()
    const remote = doble()
    let logged = false
    const storage = new SessionAwareCartStorage(local, remote, () => logged)

    await storage.save([line()])
    logged = true
    await storage.save([line()])

    expect(local.save).toHaveBeenCalledTimes(1)
    expect(remote.save).toHaveBeenCalledTimes(1)
  })

  it('sabe leer y vaciar la cesta del invitado para poder fundirla', async () => {
    const local = doble()
    const remote = doble()
    const storage = new SessionAwareCartStorage(local, remote, () => true)

    await storage.guestLines()
    await storage.clearGuest()

    expect(local.load).toHaveBeenCalled()
    expect(local.clear).toHaveBeenCalled()
    expect(remote.clear).not.toHaveBeenCalled()
  })

  /**
   * El servidor EXIGE el precio de origen al guardar una línea. Sin él responde 400, el almacén
   * relanza el error y la pantalla —que no lo recogía— dejaba el botón como si nada hubiera pasado:
   * la cesta se quedaba vacía y no había forma de saber por qué. Era imposible comprar desde la app.
   */
  it('manda el precio de origen y su divisa, que el servidor exige', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').reply(200, [])
    mock.onPut('/me/cart').reply(204)
    const storage = new HttpCartStorage(client)
    await storage.load()

    await storage.save([
      {
        productId: 'p-1',
        slug: 'gorro',
        title: 'Gorro',
        quantity: 1,
        unitPriceSource: 3.52,
        sourceCurrency: 'EUR',
      },
    ])

    const enviado = JSON.parse(mock.history.put[0]?.data ?? '{}')
    expect(enviado.unitPriceSource).toBe(3.52)
    expect(enviado.sourceCurrency).toBe('EUR')
  })

  /** Sin precio conocido se manda cero en dólares: el servidor lo recalcula, pero exige que vaya. */
  it('nunca deja el precio de origen sin poner', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/cart').reply(200, [])
    mock.onPut('/me/cart').reply(204)
    const storage = new HttpCartStorage(client)
    await storage.load()

    await storage.save([{ productId: 'p-1', slug: 'gorro', title: 'Gorro', quantity: 1 }])

    const enviado = JSON.parse(mock.history.put[0]?.data ?? '{}')
    expect(enviado.unitPriceSource).toBe(0)
    expect(enviado.sourceCurrency).toBe('USD')
  })
})
