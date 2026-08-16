import { StoredSession } from '../entities/session'

export interface SessionStorage {
  load(): Promise<StoredSession | null>
  save(session: StoredSession): Promise<void>
  clear(): Promise<void>
}
