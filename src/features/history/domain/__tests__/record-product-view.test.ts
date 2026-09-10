import { AppError } from '@core/errors/app-error'

import { FakeHistoryRepository } from '../testing/fake-history-repository'
import { RecordProductView } from '../usecases/record-product-view'

/**
 * Anotar la visita es un efecto de segunda fila: sirve para el historial y para el correo de
 * recordatorio, y nunca puede estropear la pantalla que la persona está mirando.
 */
describe('RecordProductView', () => {
  it('anota el producto que se ha abierto', async () => {
    const repository = new FakeHistoryRepository()

    const result = await new RecordProductView(repository).execute('p-1')

    expect(result.ok).toBe(true)
    expect(repository.recorded).toEqual(['p-1'])
  })

  it('sale bien aunque el servidor rechace la anotación', async () => {
    // La ficha ya está pintada: un fallo aquí no puede convertirse en un aviso sobre el producto.
    const repository = new FakeHistoryRepository({ error: new AppError('NETWORK', 'sin red') })

    const result = await new RecordProductView(repository).execute('p-1')

    expect(result.ok).toBe(true)
  })

  it('no llama al servidor cuando no hay producto', async () => {
    const repository = new FakeHistoryRepository()

    const result = await new RecordProductView(repository).execute('   ')

    expect(result.ok).toBe(true)
    expect(repository.recorded).toEqual([])
  })
})
