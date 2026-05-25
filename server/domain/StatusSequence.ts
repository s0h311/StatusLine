export type Status = {
  id: string
  userId: string
  name: string
  position: number
  notify: boolean
}

export type StatusIdentifier = { id: string; userId: string }

export type StatusStore = {
  getByUserId(userId: string): Promise<Status[]>
  insert(data: { userId: string; name: string; position: number; notify: boolean }): Promise<Status>
  update(target: StatusIdentifier, data: Partial<Pick<Status, 'position' | 'notify'>>): Promise<Status | null>
  remove(target: StatusIdentifier): Promise<boolean>
  batchUpdatePositions(userId: string, updates: { id: string; position: number }[]): Promise<void>
}

export function createStatusSequence(store: StatusStore) {
  return {
    async getStatuses(userId: string): Promise<Status[]> {
      const statuses = await store.getByUserId(userId)
      return statuses.toSorted((a, b) => a.position - b.position)
    },

    async addStatus(userId: string, opts: { name: string; position?: number }): Promise<Status> {
      const existing = await store.getByUserId(userId)
      const sorted = existing.toSorted((a, b) => a.position - b.position)
      const targetPosition = opts.position ?? sorted.length

      const toShift = sorted.filter((s) => s.position >= targetPosition)
      if (toShift.length > 0) {
        await store.batchUpdatePositions(
          userId,
          toShift.map((s) => ({ id: s.id, position: s.position + 1 })),
        )
      }

      return store.insert({ userId, name: opts.name, position: targetPosition, notify: false })
    },

    async removeStatus(target: StatusIdentifier): Promise<void> {
      const existing = await store.getByUserId(target.userId)
      const found = existing.find((s) => s.id === target.id)
      if (!found) return

      await store.remove(target)

      const remaining = existing.filter((s) => s.id !== target.id).toSorted((a, b) => a.position - b.position)
      const updates = remaining.map((s, i) => ({ id: s.id, position: i }))
      if (updates.length > 0) {
        await store.batchUpdatePositions(target.userId, updates)
      }
    },

    async reorderStatuses(userId: string, statusIds: string[]): Promise<void> {
      const existing = await store.getByUserId(userId)
      const existingIds = new Set(existing.map((s) => s.id))
      for (const id of statusIds) {
        if (!existingIds.has(id)) throw new Error('Status not found')
      }
      if (statusIds.length !== existing.length) throw new Error('Must include all statuses')

      await store.batchUpdatePositions(
        userId,
        statusIds.map((id, i) => ({ id, position: i })),
      )
    },

    async toggleNotify(target: StatusIdentifier): Promise<Status> {
      const existing = await store.getByUserId(target.userId)
      const found = existing.find((s) => s.id === target.id)
      if (!found) throw new Error('Status not found')

      const updated = await store.update(target, { notify: !found.notify })
      if (!updated) throw new Error('Status not found')
      return updated
    },
  }
}
