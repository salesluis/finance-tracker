import { describe, expect, it } from 'vitest'
import { monthlyTotals } from './finance-calculator'
import type { FinancialEntry, FinancialOccurrence } from '@/types/finance'
const entries: FinancialEntry[] = [
    {
        id: 'i',
        description: 'Salário',
        type: 'income',
        categoryId: 'salary',
        amountInCents: 10000,
        startDate: '2026-01-01',
        recurrenceType: 'single',
    },
    {
        id: 'e',
        description: 'Casa',
        type: 'expense',
        categoryId: 'home',
        amountInCents: 4000,
        startDate: '2026-01-01',
        recurrenceType: 'single',
    },
]
const occurrences: FinancialOccurrence[] = [
    { id: '1', entryId: 'i', referenceMonth: '2026-01', amountInCents: 10000, status: 'received' },
    { id: '2', entryId: 'e', referenceMonth: '2026-01', amountInCents: 4000, status: 'planned' },
]
describe('monthlyTotals', () => {
    it('separa realizado de previsão', () => {
        expect(monthlyTotals(entries, occurrences, '2026-01', 'actual')).toMatchObject({
            income: 10000,
            expense: 0,
            balance: 10000,
        })
        expect(monthlyTotals(entries, occurrences, '2026-01', 'forecast')).toMatchObject({
            income: 10000,
            expense: 4000,
            balance: 6000,
            planned: 4000,
        })
    })
})
