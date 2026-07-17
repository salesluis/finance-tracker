import type { Category, FinancialEntry, FinancialOccurrence, ViewMode } from '@/types/finance'

export const isIncluded = (o: FinancialOccurrence, mode: ViewMode) => mode === 'forecast' || o.status !== 'planned'
export function monthlyTotals(
    entries: FinancialEntry[],
    occurrences: FinancialOccurrence[],
    month: string,
    mode: ViewMode,
) {
    const selected = occurrences.filter((o) => o.referenceMonth === month && isIncluded(o, mode))
    const sum = (type: 'income' | 'expense') =>
        selected
            .filter((o) => entries.find((e) => e.id === o.entryId)?.type === type)
            .reduce((a, o) => a + o.amountInCents, 0)
    const income = sum('income'),
        expense = sum('expense')
    return {
        income,
        expense,
        balance: income - expense,
        planned: occurrences
            .filter((o) => o.referenceMonth === month && o.status === 'planned')
            .reduce((a, o) => a + o.amountInCents, 0),
    }
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
    return categories
        .filter((c) => c.type === 'expense')
        .map((category) => ({
            category,
            value: occurrences
                .filter(
                    (o) =>
                        o.referenceMonth === month &&
                        isIncluded(o, mode) &&
                        entries.find((e) => e.id === o.entryId)?.categoryId === category.id,
                )
                .reduce((a, o) => a + o.amountInCents, 0),
        }))
        .filter((x) => x.value > 0)
}
