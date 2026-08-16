import { HttpAddressRepository } from '../repositories/http-address.repository'
import { makeClient } from '../testing/make-client'

const ADDRESS = {
  id: 'a-1',
  label: 'Casa',
  fullName: 'Ana Ruiz',
  phone: '+34600111222',
  line1: 'Calle Mayor 1',
  line2: null,
  city: 'Madrid',
  state: '',
  postalCode: '28013',
  country: 'es',
  default: true,
  createdAt: '2026-08-01T10:00:00Z',
}

describe('HttpAddressRepository', () => {
  it('lee la libreta y normaliza el país a mayúsculas', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/addresses').reply(200, [ADDRESS])

    const result = await new HttpAddressRepository(client).list()

    expect(result.ok && result.value[0]?.country).toBe('ES')
    expect(result.ok && result.value[0]?.isDefault).toBe(true)
  })

  it('convierte los huecos del backend en ausencia de dato', async () => {
    // Una cadena vacía pintaría un renglón en blanco en la ficha de la dirección.
    const { client, mock } = makeClient()
    mock.onGet('/me/addresses').reply(200, [ADDRESS])

    const result = await new HttpAddressRepository(client).list()

    expect(result.ok && result.value[0]?.line2).toBeUndefined()
    expect(result.ok && result.value[0]?.state).toBeUndefined()
  })

  it('crea la dirección mandando isDefault, que es como la espera el backend', async () => {
    const { client, mock } = makeClient()
    let body: unknown = null
    mock.onPost('/me/addresses').reply((config) => {
      body = JSON.parse(config.data as string)
      return [200, { ...ADDRESS, id: 'a-9' }]
    })

    const result = await new HttpAddressRepository(client).create({
      fullName: ' Ana Ruiz ',
      line1: ' Calle Mayor 1 ',
      city: ' Madrid ',
      country: 'es',
      isDefault: true,
    })

    expect(body).toMatchObject({
      fullName: 'Ana Ruiz',
      line1: 'Calle Mayor 1',
      city: 'Madrid',
      country: 'ES',
      isDefault: true,
    })
    expect(result.ok && result.value.id).toBe('a-9')
  })

  it('tolera una dirección sin campos opcionales', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/addresses').reply(200, [{ id: 'a-2' }])

    const result = await new HttpAddressRepository(client).list()

    expect(result.ok && result.value[0]?.fullName).toBe('')
    expect(result.ok && result.value[0]?.isDefault).toBe(false)
  })

  it('traduce un fallo de red a NETWORK', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/addresses').networkError()

    const result = await new HttpAddressRepository(client).list()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })

  it('falla con CONTRACT si la libreta no cumple el esquema', async () => {
    const { client, mock } = makeClient()
    mock.onGet('/me/addresses').reply(200, { items: [] })

    const result = await new HttpAddressRepository(client).list()

    expect(!result.ok && result.error.code).toBe('CONTRACT')
  })
})
