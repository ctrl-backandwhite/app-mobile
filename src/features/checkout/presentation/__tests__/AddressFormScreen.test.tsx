import { fireEvent, screen, waitFor } from '@testing-library/react-native'

import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'
import { anAddress } from '@features/checkout/domain/testing/checkout-builders'

import { AddressFormScreen } from '../screens/AddressFormScreen'
import { renderCheckout } from '../testing/render-checkout'

function deps(overrides: Record<string, unknown> = {}) {
  return {
    createAddress: { execute: jest.fn().mockResolvedValue(ok(anAddress({ id: 'a-9' }))) },
    listRegions: { execute: jest.fn().mockResolvedValue(ok([])) },
    ...overrides,
  }
}

/** Rellena lo imprescindible y espera a que la consulta de regiones del país se asiente. */
async function fill(container: { listRegions: { execute: jest.Mock } }): Promise<void> {
  await fireEvent.changeText(screen.getByLabelText('Nombre y apellidos'), 'Ana Ruiz')
  await fireEvent.changeText(screen.getByLabelText('Dirección'), 'Calle Mayor 1')
  await fireEvent.changeText(screen.getByLabelText('Ciudad'), 'Madrid')
  await fireEvent.changeText(screen.getByLabelText('País (código de dos letras)'), 'es')
  await waitFor(() => expect(container.listRegions.execute).toHaveBeenCalledWith('ES'))
}

describe('AddressFormScreen', () => {
  it('no deja guardar hasta que están los datos imprescindibles', async () => {
    const container = deps()
    await renderCheckout(<AddressFormScreen />, container)

    await fireEvent.press(screen.getByText('Guardar dirección'))

    expect(container.createAddress.execute).not.toHaveBeenCalled()
  })

  it('crea la dirección con el país en mayúsculas y vuelve atrás', async () => {
    const container = deps()
    await renderCheckout(<AddressFormScreen />, container)

    await fill(container)
    await fireEvent.press(screen.getByText('Guardar dirección'))

    await waitFor(() =>
      expect(container.createAddress.execute).toHaveBeenCalledWith(
        expect.objectContaining({ fullName: 'Ana Ruiz', city: 'Madrid', country: 'ES' }),
      ),
    )
    expect(global.routerMock.back).toHaveBeenCalled()
  })

  it('marca la dirección como predeterminada si se pide', async () => {
    const container = deps()
    await renderCheckout(<AddressFormScreen />, container)

    await fill(container)
    await fireEvent.press(screen.getByLabelText('Usar como dirección predeterminada'))
    await fireEvent.press(screen.getByText('Guardar dirección'))

    await waitFor(() =>
      expect(container.createAddress.execute).toHaveBeenCalledWith(
        expect.objectContaining({ isDefault: true }),
      ),
    )
  })

  it('enseña el fallo del backend y no vuelve atrás', async () => {
    const container = deps({
      createAddress: {
        execute: jest.fn().mockResolvedValue(err(new AppError('VALIDATION', 'Ese código postal no existe.'))),
      },
    })
    await renderCheckout(<AddressFormScreen />, container)

    await fill(container)
    await fireEvent.press(screen.getByText('Guardar dirección'))

    expect(await screen.findByText('Ese código postal no existe.')).toBeTruthy()
    expect(global.routerMock.back).not.toHaveBeenCalled()
  })

  it('ofrece las regiones del país cuando el backend las tiene', async () => {
    const container = deps({
      listRegions: {
        execute: jest.fn().mockResolvedValue(
          ok([
            { code: 'CA', name: 'California' },
            { code: 'NY', name: 'Nueva York' },
          ]),
        ),
      },
    })
    await renderCheckout(<AddressFormScreen />, container)

    await fireEvent.changeText(screen.getByLabelText('País (código de dos letras)'), 'us')

    expect(await screen.findByLabelText('California')).toBeTruthy()
    await waitFor(() => expect(container.listRegions.execute).toHaveBeenCalledWith('US'))
  })

  it('elige la región y la manda con la dirección', async () => {
    const container = deps({
      listRegions: { execute: jest.fn().mockResolvedValue(ok([{ code: 'CA', name: 'California' }])) },
    })
    await renderCheckout(<AddressFormScreen />, container)

    await fill(container)
    await fireEvent.changeText(screen.getByLabelText('País (código de dos letras)'), 'us')
    await fireEvent.press(await screen.findByLabelText('California'))
    await fireEvent.press(screen.getByText('Guardar dirección'))

    await waitFor(() =>
      expect(container.createAddress.execute).toHaveBeenCalledWith(
        expect.objectContaining({ state: 'CA', country: 'US' }),
      ),
    )
  })

  it('deja escribir la provincia a mano cuando el país no tiene regiones curadas', async () => {
    // La mayoría de países no las tienen: sin campo libre, la dirección se quedaría sin provincia.
    const container = deps()
    await renderCheckout(<AddressFormScreen />, container)

    await fireEvent.changeText(screen.getByLabelText('País (código de dos letras)'), 'es')
    await waitFor(() => expect(container.listRegions.execute).toHaveBeenCalledWith('ES'))

    expect(screen.getByLabelText('Provincia o estado')).toBeTruthy()
  })

  it('manda también los datos opcionales que se han rellenado', async () => {
    const container = deps()
    await renderCheckout(<AddressFormScreen />, container)

    await fill(container)
    await fireEvent.changeText(screen.getByLabelText('Etiqueta'), 'Oficina')
    await fireEvent.changeText(screen.getByLabelText('Teléfono'), '+34600111222')
    await fireEvent.changeText(screen.getByLabelText('Piso, puerta, referencia'), '3º B')
    await fireEvent.changeText(screen.getByLabelText('Código postal'), '28013')
    await fireEvent.changeText(screen.getByLabelText('Provincia o estado'), 'Madrid')
    await fireEvent.press(screen.getByText('Guardar dirección'))

    await waitFor(() =>
      expect(container.createAddress.execute).toHaveBeenCalledWith(
        expect.objectContaining({
          label: 'Oficina',
          phone: '+34600111222',
          line2: '3º B',
          postalCode: '28013',
          state: 'Madrid',
        }),
      ),
    )
  })

  it('vuelve atrás al cancelar sin crear nada', async () => {
    const container = deps()
    await renderCheckout(<AddressFormScreen />, container)

    await fireEvent.press(screen.getByText('Cancelar'))

    expect(global.routerMock.back).toHaveBeenCalled()
    expect(container.createAddress.execute).not.toHaveBeenCalled()
  })
})
