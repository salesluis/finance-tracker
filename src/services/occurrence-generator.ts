import type { FinancialEntry, FinancialOccurrence } from '@/types/finance'

function addMonths(month: string, amount: number) {
    const [year, m] = month.split('-').map(Number)
    const date = new Date(Date.UTC(year, m - 1 + amount, 1))
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}
export const occurrenceId = (entryId: string, month: string, installment?: number) =>
    `${entryId}:${month}:${installment ?? 'r'}`

export function generateOccurrences(entry: FinancialEntry, throughYear: number): FinancialOccurrence[] {
    const startMonth = entry.startDate.slice(0, 7)
    const status = 'planned' as const
    if (entry.recurrenceType === 'single') {
        if (Number(startMonth.slice(0, 4)) > throughYear) return []
        return [
            {
                id: occurrenceId(entry.id, startMonth),
                entryId: entry.id,
                referenceMonth: startMonth,
                amountInCents: entry.amountInCents,
                status,
            },
        ]
    }
    if (entry.recurrenceType === 'installment') {
        const first = entry.initialInstallment ?? 1
        const total = entry.installmentCount ?? first
        return Array.from({ length: Math.max(0, total - first + 1) }, (_, i) => {
            const number = first + i
            const month = addMonths(startMonth, i)
            return {
                id: occurrenceId(entry.id, month, number),
                entryId: entry.id,
                referenceMonth: month,
                amountInCents: entry.amountInCents,
                installmentNumber: number,
                installmentCount: total,
                status,
            }
        }).filter((o) => Number(o.referenceMonth.slice(0, 4)) <= throughYear)
    }
    const endMonth = `${throughYear}-12`
    const result: FinancialOccurrence[] = []
    for (let month = startMonth; month <= endMonth; month = addMonths(month, 1))
        result.push({
            id: occurrenceId(entry.id, month),
            entryId: entry.id,
            referenceMonth: month,
            amountInCents: entry.amountInCents,
            status,
        })
    return result
}
