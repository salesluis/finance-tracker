import { describe, expect, it } from 'vitest'
import { annualSeries, categoryDistribution, monthlyTotals } from './finance-calculator'
import type { Category, FinancialEntry, FinancialOccurrence } from '@/types/finance'
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
        expect(monthlyTotals(entries, occurrences, '2026-01', 'actual')).toEqual({
            income: 10000,
            expense: 0,
            balance: 10000,
            planned: 4000,
        })
        expect(monthlyTotals(entries, occurrences, '2026-01', 'forecast')).toEqual({
            income: 10000,
            expense: 4000,
            balance: 6000,
            planned: 4000,
        })
    })

    it('soma somente ocorrências do mês que possuem um lançamento correspondente', () => {
        const invalidOccurrences: FinancialOccurrence[] = [
            ...occurrences,
            { id: '3', entryId: 'i', referenceMonth: '2026-02', amountInCents: 90000, status: 'received' },
            { id: '4', entryId: 'missing', referenceMonth: '2026-01', amountInCents: 50000, status: 'planned' },
        ]

        expect(monthlyTotals(entries, invalidOccurrences, '2026-01', 'forecast')).toEqual({
            income: 10000,
            expense: 4000,
            balance: 6000,
            planned: 4000,
        })
    })
})

describe('annualSeries', () => {
    it('produz os doze meses do ano com os mesmos critérios dos totais mensais', () => {
        const series = annualSeries(entries, occurrences, 2026, 'forecast')

        expect(series).toHaveLength(12)
        expect(series[0]).toEqual({ month: 0, income: 10000, expense: 4000, balance: 6000, planned: 4000 })
        expect(series[1]).toEqual({ month: 1, income: 0, expense: 0, balance: 0, planned: 0 })
    })
})

describe('categoryDistribution', () => {
    const categories: Category[] = [
        {
            id: 'home',
            name: 'Casa',
            type: 'expense',
            backgroundColor: '#000',
            foregroundColor: '#fff',
            markerName: 'house',
        },
        {
            id: 'salary',
            name: 'Salário',
            type: 'income',
            backgroundColor: '#000',
            foregroundColor: '#fff',
            markerName: 'wallet',
        },
    ]

    it('agrupa apenas despesas incluídas no modo selecionado', () => {
        expect(categoryDistribution(entries, occurrences, categories, '2026-01', 'actual')).toEqual([])
        expect(categoryDistribution(entries, occurrences, categories, '2026-01', 'forecast')).toEqual([
            { category: categories[0], value: 4000 },
        ])
    })

    it('não classifica receita como despesa mesmo quando a categoria está inconsistente', () => {
        const inconsistentEntries = [{ ...entries[0], categoryId: 'home' }, entries[1]]

        expect(categoryDistribution(inconsistentEntries, occurrences, categories, '2026-01', 'forecast')).toEqual([
            { category: categories[0], value: 4000 },
        ])
    })
})
