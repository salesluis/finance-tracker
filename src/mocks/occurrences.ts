import { entries } from './entries'
import { generateOccurrences } from '@/services/occurrence-generator'
import type { FinancialOccurrence } from '@/types/finance'

export const occurrences: FinancialOccurrence[] = entries
    .flatMap((entry) => generateOccurrences(entry, 2026))
    .map((o) => {
        if (o.referenceMonth < '2026-07')
            return {
                ...o,
                status: entryType(o.entryId) === 'income' ? 'received' : 'paid',
                completedAt: `${o.referenceMonth}-20`,
            }
        return o
    })
function entryType(id: string) {
    return entries.find((e) => e.id === id)?.type
}
