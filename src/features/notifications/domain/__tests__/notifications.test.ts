import { AppError } from '@core/errors/app-error'
import { err, ok } from '@core/result/result'

import { PlatformNotification, unreadCountOf } from '../entities/notification'
import { NotificationsRepository } from '../ports/notifications-repository'
import {
  ArchiveNotification,
  ListNotifications,
  MarkAllNotificationsRead,
  MarkNotificationRead,
} from '../usecases/notifications'

function aviso(overrides: Partial<PlatformNotification> = {}): PlatformNotification {
  return {
    id: 'n-1',
    title: 'Tu pedido va en camino',
    body: 'NX-2026-0001 ha salido del almacén.',
    eventType: 'ORDER_SHIPPED',
    read: false,
    createdAt: '2026-09-06T10:00:00Z',
    ...overrides,
  }
}

function repositorio(overrides: Partial<NotificationsRepository> = {}): NotificationsRepository {
  return {
    inbox: jest.fn().mockResolvedValue(ok([])),
    markRead: jest.fn().mockResolvedValue(ok(undefined)),
    markAllRead: jest.fn().mockResolvedValue(ok(undefined)),
    archive: jest.fn().mockResolvedValue(ok(undefined)),
    ...overrides,
  }
}

describe('unreadCountOf', () => {
  it('cuenta solo lo que queda sin leer', () => {
    expect(unreadCountOf([aviso(), aviso({ id: 'n-2', read: true })])).toBe(1)
  })

  it('devuelve cero con la bandeja vacía', () => {
    expect(unreadCountOf([])).toBe(0)
  })
})

describe('ListNotifications', () => {
  it('devuelve la bandeja de entrada', async () => {
    const bandeja = [aviso()]

    const result = await new ListNotifications(
      repositorio({ inbox: jest.fn().mockResolvedValue(ok(bandeja)) }),
    ).execute()

    expect(result.ok && result.value).toEqual(bandeja)
  })

  it('propaga el fallo', async () => {
    const result = await new ListNotifications(
      repositorio({ inbox: jest.fn().mockResolvedValue(err(new AppError('NETWORK', 'sin red'))) }),
    ).execute()

    expect(!result.ok && result.error.code).toBe('NETWORK')
  })
})

describe('MarkNotificationRead', () => {
  it('marca el aviso', async () => {
    const markRead = jest.fn().mockResolvedValue(ok(undefined))

    await new MarkNotificationRead(repositorio({ markRead })).execute(' n-3 ')

    expect(markRead).toHaveBeenCalledWith('n-3')
  })

  it('no llama al backend sin identificador', async () => {
    const markRead = jest.fn()

    const result = await new MarkNotificationRead(repositorio({ markRead })).execute('  ')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(markRead).not.toHaveBeenCalled()
  })
})

describe('MarkAllNotificationsRead', () => {
  it('marca todo', async () => {
    const markAllRead = jest.fn().mockResolvedValue(ok(undefined))

    await new MarkAllNotificationsRead(repositorio({ markAllRead })).execute()

    expect(markAllRead).toHaveBeenCalled()
  })
})

describe('ArchiveNotification', () => {
  it('archiva el aviso', async () => {
    const archive = jest.fn().mockResolvedValue(ok(undefined))

    await new ArchiveNotification(repositorio({ archive })).execute('n-4')

    expect(archive).toHaveBeenCalledWith('n-4')
  })

  it('no archiva sin identificador', async () => {
    const archive = jest.fn()

    const result = await new ArchiveNotification(repositorio({ archive })).execute('')

    expect(!result.ok && result.error.code).toBe('VALIDATION')
    expect(archive).not.toHaveBeenCalled()
  })
})
