import { AppError } from '@core/errors/app-error'

import { anAddress } from '../testing/checkout-builders'
import { FakeAddressRepository } from '../testing/fake-address-repository'
import { CreateAddress } from '../usecases/create-address'
import { ListAddresses } from '../usecases/list-addresses'

describe('ListAddresses', () => {
  it('devuelve la predeterminada la primera para poder proponerla', async () => {
    const repository = new FakeAddressRepository({
      addresses: [anAddress({ id: 'a-1', isDefault: false }), anAddress({ id: 'a-2', isDefault: true })],
    })

    const result = await new ListAddresses(repository).execute()

    expect(result.ok && result.value.map((address) => address.id)).toEqual(['a-2', 'a-1'])
  })

  it('propaga el fallo del backend', async () => {
    const repository = new FakeAddressRepository({ error: new AppError('NETWORK', 'Sin conexión') })

    const result = await new ListAddresses(repository).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('CreateAddress', () => {
  it('no llama al backend con la dirección incompleta', async () => {
    const repository = new FakeAddressRepository()

    const result = await new CreateAddress(repository).execute({
      fullName: 'Ana Ruiz',
      line1: '',
      city: 'Madrid',
      country: 'ES',
    })

    expect(repository.created).toHaveLength(0)
    expect(!result.ok && result.error.code).toBe('VALIDATION')
  })

  it('normaliza el país a dos letras mayúsculas, que es lo que cotiza los portes', async () => {
    const repository = new FakeAddressRepository()

    await new CreateAddress(repository).execute({
      fullName: 'Ana Ruiz',
      line1: 'Calle Mayor 1',
      city: 'Madrid',
      country: ' es ',
    })

    expect(repository.created[0]?.country).toBe('ES')
  })

  it('devuelve la dirección con el identificador que ha puesto el backend', async () => {
    const repository = new FakeAddressRepository()

    const result = await new CreateAddress(repository).execute({
      fullName: 'Ana Ruiz',
      line1: 'Calle Mayor 1',
      city: 'Madrid',
      country: 'ES',
      isDefault: true,
    })

    expect(result.ok && result.value.id).toBe('a-1')
    expect(result.ok && result.value.isDefault).toBe(true)
  })
})
