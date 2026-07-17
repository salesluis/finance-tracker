import { describe, expect, it } from 'vitest'
import { generateOccurrences } from './occurrence-generator'
import type { FinancialEntry } from '@/types/finance'
const base: FinancialEntry = {
    id: 'x',
    description: 'Teste',
    type: 'expense',
    categoryId: 'home',
    amountInCents: 7500,
    startDate: '2026-08-10',
    recurrenceType: 'single',
}
describe('generateOccurrences', () => {
    it('gera lançamento único', () => expect(generateOccurrences(base, 2026)).toHaveLength(1))
    it('gera parcelas a partir da parcela inicial', () => {
        const result = generateOccurrences(
            { ...base, recurrenceType: 'installment', initialInstallment: 2, installmentCount: 4 },
            2026,
        )
        expect(result.map((x) => x.installmentNumber)).toEqual([2, 3, 4])
        expect(result.map((x) => x.referenceMonth)).toEqual(['2026-08', '2026-09', '2026-10'])
    })
    it('gera mensalidades até dezembro do ano consultado', () => {
        const result = generateOccurrences({ ...base, recurrenceType: 'monthly', startDate: '2026-11-10' }, 2027)
        expect(result).toHaveLength(14)
        expect(result.at(-1)?.referenceMonth).toBe('2027-12')
    })
})
