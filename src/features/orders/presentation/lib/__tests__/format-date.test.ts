import { formatDate, formatDateTime } from '../format-date'

describe('formatDate', () => {
  it('pinta la fecha del pedido en corto', () => {
    expect(formatDate('2026-08-01T10:00:00Z')).toMatch(/2026/)
  })

  it('deja un hueco cuando no hay fecha', () => {
    expect(formatDate(undefined)).toBe('—')
  })

  it('trata una fecha ilegible como ausente en lugar de pintar «Invalid Date»', () => {
    expect(formatDate('no es una fecha')).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('añade la hora, sin la cual no se sabe en qué orden ocurrió el paso', () => {
    expect(formatDateTime('2026-08-01T10:30:00Z')).toMatch(/\d{2}:\d{2}/)
  })

  it('deja un hueco cuando no hay fecha', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })

  it('trata una fecha ilegible como ausente', () => {
    expect(formatDateTime('')).toBe('—')
  })
})
