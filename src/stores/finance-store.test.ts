import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const repository = vi.hoisted(() => ({
    getCategories: vi.fn(),
    getEntries: vi.fn(),
    getOccurrences: vi.fn(),
    ensureOccurrencesThroughYear: vi.fn(),
    createEntry: vi.fn(),
    updateEntry: vi.fn(),
    deleteEntry: vi.fn(),
    updateOccurrenceStatus: vi.fn(),
}))

vi.mock('@/repositories', () => ({ financeRepository: repository }))

import { useFinanceStore } from './finance-store'

describe('useFinanceStore', () => {
    beforeEach(() => {
        setActivePinia(createPinia())
        vi.clearAllMocks()
    })

    it('does not publish a partial refresh when one resource fails', async () => {
        repository.getCategories.mockResolvedValue([{ id: 'category' }])
        repository.getEntries.mockRejectedValue(new Error('entries unavailable'))
        repository.getOccurrences.mockResolvedValue([{ id: 'occurrence' }])
        const store = useFinanceStore()

        await store.initialize()

        expect(store.categories).toEqual([])
        expect(store.entries).toEqual([])
        expect(store.occurrences).toEqual([])
        expect(store.error).toBe('entries unavailable')
        expect(store.initialized).toBe(false)
    })
})
