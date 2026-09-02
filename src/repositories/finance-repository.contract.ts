import { describe, expect, it } from 'vitest'
import type { FinanceRepository } from './finance-repository'

/** Shared behavioral checks that every persistence adapter must satisfy. */
export function financeRepositoryReadContract(name: string, createRepository: () => FinanceRepository) {
    describe(`${name} read contract`, () => {
        it('returns all resource collections as detached values', async () => {
            const repository = createRepository()
            const [categories, entries, occurrences] = await Promise.all([
                repository.getCategories(),
                repository.getEntries(),
                repository.getOccurrences(),
            ])

            expect(categories.length).toBeGreaterThan(0)
            expect(entries.length).toBeGreaterThan(0)
            expect(occurrences.length).toBeGreaterThan(0)

            const originalName = categories[0].name
            categories[0].name = 'mutated by caller'
            expect((await repository.getCategories())[0].name).toBe(originalName)
        })
    })
}
