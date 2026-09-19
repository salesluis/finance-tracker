import type { Category, FinancialEntry, FinancialOccurrence, ViewMode } from '@/types/finance'

export const isIncluded = (o: FinancialOccurrence, mode: ViewMode) => mode === 'forecast' || o.status !== 'planned'

interface MonthlyTotals {
    income: number
    expense: number
    balance: number
    planned: number
}

export function monthlyTotals(
    entries: FinancialEntry[],
    occurrences: FinancialOccurrence[],
    month: string,
    mode: ViewMode,
): MonthlyTotals {
    const entryTypes = new Map(entries.map((entry) => [entry.id, entry.type]))
    let income = 0
    let expense = 0
    let planned = 0

    for (const occurrence of occurrences) {
        if (occurrence.referenceMonth !== month) continue

        const type = entryTypes.get(occurrence.entryId)
        // Uma ocorrência sem o lançamento de origem não tem significado financeiro confiável.
        if (!type) continue

        if (occurrence.status === 'planned') planned += occurrence.amountInCents
        if (!isIncluded(occurrence, mode)) continue

        if (type === 'income') income += occurrence.amountInCents
        else expense += occurrence.amountInCents
    }

    return { income, expense, balance: income - expense, planned }
}
export function annualSeries(
    entries: FinancialEntry[],
    occurrences: FinancialOccurrence[],
    year: number,
    mode: ViewMode,
) {
    return Array.from({ length: 12 }, (_, i) => {
        const month = `${year}-${String(i + 1).padStart(2, '0')}`
        return { month: i, ...monthlyTotals(entries, occurrences, month, mode) }
    })
}
export function categoryDistribution(
    entries: FinancialEntry[],
    occurrences: FinancialOccurrence[],
    categories: Category[],
    month: string,
    mode: ViewMode,
) {
    const entriesById = new Map(entries.map((entry) => [entry.id, entry]))
    const expensesByCategory = new Map<string, number>()

    for (const occurrence of occurrences) {
        if (occurrence.referenceMonth !== month || !isIncluded(occurrence, mode)) continue

        const entry = entriesById.get(occurrence.entryId)
        if (!entry || entry.type !== 'expense') continue
        expensesByCategory.set(
            entry.categoryId,
            (expensesByCategory.get(entry.categoryId) ?? 0) + occurrence.amountInCents,
        )
    }

    return categories
        .filter((c) => c.type === 'expense')
        .map((category) => ({
            category,
            value: expensesByCategory.get(category.id) ?? 0,
        }))
        .filter((x) => x.value > 0)
}
