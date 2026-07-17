import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { financeRepositoryReadContract } from './finance-repository.contract'
import { MockFinanceRepository } from './mock-finance-repository'

class MemoryStorage implements Storage {
    private values = new Map<string, string>()
    get length() {
        return this.values.size
    }
    clear() {
        this.values.clear()
    }
    getItem(key: string) {
        return this.values.get(key) ?? null
    }
    key(index: number) {
        return [...this.values.keys()][index] ?? null
    }
    removeItem(key: string) {
        this.values.delete(key)
    }
    setItem(key: string, value: string) {
        this.values.set(key, value)
    }
}

beforeAll(() => vi.stubGlobal('localStorage', new MemoryStorage()))
beforeEach(() => localStorage.clear())

financeRepositoryReadContract('MockFinanceRepository', () => new MockFinanceRepository())

describe('MockFinanceRepository', () => {
    it('ensures a year idempotently', async () => {
        const repository = new MockFinanceRepository()
        await repository.ensureOccurrencesThroughYear(2027)
        const first = await repository.getOccurrences()
        await repository.ensureOccurrencesThroughYear(2027)
        const second = await repository.getOccurrences()

        expect(second).toEqual(first)
    })

    it('returns the updated occurrence', async () => {
        const repository = new MockFinanceRepository()
        const expense = (await repository.getEntries()).find((entry) => entry.type === 'expense')!
        const occurrence = (await repository.getOccurrences()).find((item) => item.entryId === expense.id)!

        const updated = await repository.updateOccurrenceStatus(occurrence.id, 'paid')

        expect(updated.status).toBe('paid')
        expect(updated.completedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })

    it('migrates decimal values stored by v1 to integer cents', async () => {
        localStorage.setItem(
            'finance-tracker:v1',
            JSON.stringify({
                categories: [],
                entries: [{ id: 'e', amount: 45.9 }],
                occurrences: [{ id: 'o', amount: 45.9 }],
                generatedThrough: {},
            }),
        )

        const repository = new MockFinanceRepository()

        expect((await repository.getEntries())[0].amountInCents).toBe(4590)
        expect((await repository.getOccurrences())[0].amountInCents).toBe(4590)
        expect(localStorage.getItem('finance-tracker:v2')).not.toBeNull()
    })
})
