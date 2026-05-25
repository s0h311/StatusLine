import { describe, test, expect, beforeEach } from 'vitest'
import { createStatusSequence, type Status, type StatusStore } from './StatusSequence'

function createInMemoryStore(): StatusStore {
  const statuses: Status[] = []
  let nextId = 1

  return {
    async getByUserId(userId) {
      return statuses.filter((s) => s.userId === userId)
    },
    async insert(data) {
      const status: Status = { id: String(nextId++), ...data }
      statuses.push(status)
      return status
    },
    async update(target, data) {
      const idx = statuses.findIndex((s) => s.id === target.id && s.userId === target.userId)
      if (idx === -1) return null
      const entry = statuses[idx]
      if (!entry) return null
      Object.assign(entry, data)
      return entry
    },
    async remove(target) {
      const idx = statuses.findIndex((s) => s.id === target.id && s.userId === target.userId)
      if (idx === -1) return false
      statuses.splice(idx, 1)
      return true
    },
    async batchUpdatePositions(userId, updates) {
      for (const { id, position } of updates) {
        const s = statuses.find((s) => s.id === id && s.userId === userId)
        if (s) s.position = position
      }
    },
  }
}

describe('StatusSequence', () => {
  let seq: ReturnType<typeof createStatusSequence>
  const USER = 'user-1'

  beforeEach(() => {
    seq = createStatusSequence(createInMemoryStore())
  })

  test('added status is retrievable', async () => {
    await seq.addStatus(USER, { name: 'Nicht begonnen' })
    const statuses = await seq.getStatuses(USER)
    expect(statuses).toHaveLength(1)
    const first = statuses[0]
    expect(first?.name).toBe('Nicht begonnen')
    expect(first?.position).toBe(0)
    expect(first?.notify).toBe(false)
  })

  test('multiple statuses are returned in position order', async () => {
    await seq.addStatus(USER, { name: 'Nicht begonnen' })
    await seq.addStatus(USER, { name: 'In Arbeit' })
    await seq.addStatus(USER, { name: 'Fertig' })
    const statuses = await seq.getStatuses(USER)
    expect(statuses.map((s) => s.name)).toEqual(['Nicht begonnen', 'In Arbeit', 'Fertig'])
    expect(statuses.map((s) => s.position)).toEqual([0, 1, 2])
  })

  test('adding at a specific position shifts existing statuses', async () => {
    await seq.addStatus(USER, { name: 'Nicht begonnen' })
    await seq.addStatus(USER, { name: 'Fertig' })
    await seq.addStatus(USER, { name: 'In Arbeit', position: 1 })
    const statuses = await seq.getStatuses(USER)
    expect(statuses.map((s) => s.name)).toEqual(['Nicht begonnen', 'In Arbeit', 'Fertig'])
    expect(statuses.map((s) => s.position)).toEqual([0, 1, 2])
  })

  test('removing a status recompacts positions', async () => {
    await seq.addStatus(USER, { name: 'Nicht begonnen' })
    const middle = await seq.addStatus(USER, { name: 'In Arbeit' })
    await seq.addStatus(USER, { name: 'Fertig' })
    await seq.removeStatus({ id: middle.id, userId: USER })
    const statuses = await seq.getStatuses(USER)
    expect(statuses.map((s) => s.name)).toEqual(['Nicht begonnen', 'Fertig'])
    expect(statuses.map((s) => s.position)).toEqual([0, 1])
  })

  test('reorder changes position of all statuses', async () => {
    const a = await seq.addStatus(USER, { name: 'Nicht begonnen' })
    const b = await seq.addStatus(USER, { name: 'In Arbeit' })
    const c = await seq.addStatus(USER, { name: 'Fertig' })
    await seq.reorderStatuses(USER, [c.id, a.id, b.id])
    const statuses = await seq.getStatuses(USER)
    expect(statuses.map((s) => s.name)).toEqual(['Fertig', 'Nicht begonnen', 'In Arbeit'])
  })

  test('toggle notify flips the flag', async () => {
    const status = await seq.addStatus(USER, { name: 'Fertig' })
    expect(status.notify).toBe(false)
    const toggled = await seq.toggleNotify({ id: status.id, userId: USER })
    expect(toggled.notify).toBe(true)
    const toggledBack = await seq.toggleNotify({ id: toggled.id, userId: USER })
    expect(toggledBack.notify).toBe(false)
  })

  test('user cannot access another users statuses', async () => {
    await seq.addStatus(USER, { name: 'Nicht begonnen' })
    await seq.addStatus('user-2', { name: 'Anderer Status' })
    const user1Statuses = await seq.getStatuses(USER)
    const user2Statuses = await seq.getStatuses('user-2')
    expect(user1Statuses).toHaveLength(1)
    expect(user1Statuses[0]?.name).toBe('Nicht begonnen')
    expect(user2Statuses).toHaveLength(1)
    expect(user2Statuses[0]?.name).toBe('Anderer Status')
  })

  test('removing nonexistent status is a no-op', async () => {
    await seq.addStatus(USER, { name: 'Nicht begonnen' })
    await seq.removeStatus({ id: 'nonexistent', userId: USER })
    const statuses = await seq.getStatuses(USER)
    expect(statuses).toHaveLength(1)
  })

  test('reorder with missing status id throws', async () => {
    const a = await seq.addStatus(USER, { name: 'Nicht begonnen' })
    await expect(seq.reorderStatuses(USER, [a.id, 'nonexistent'])).rejects.toThrow('Status not found')
  })

  test('reorder with incomplete list throws', async () => {
    const a = await seq.addStatus(USER, { name: 'Nicht begonnen' })
    await seq.addStatus(USER, { name: 'In Arbeit' })
    await expect(seq.reorderStatuses(USER, [a.id])).rejects.toThrow('Must include all statuses')
  })

  test('toggle notify on nonexistent status throws', async () => {
    await expect(seq.toggleNotify({ id: 'nonexistent', userId: USER })).rejects.toThrow('Status not found')
  })
})
