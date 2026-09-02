import type { EntryStatus, EntryType, RecurrenceType } from '@/types/finance'

/** Wire types intentionally live outside the domain so a future API change stays inside the adapter. */
export interface CategoryDto {
    id: string
    name: string
    type: EntryType
    backgroundColor: string
    foregroundColor: string
    markerName: string
}

export interface FinancialEntryDto {
    id: string
    description: string
    type: EntryType
    categoryId: string
    amountInCents: number
    startDate: string
    recurrenceType: RecurrenceType
    initialInstallment?: number
    installmentCount?: number
    account?: string
    notes?: string
}

export interface FinancialOccurrenceDto {
    id: string
    entryId: string
    referenceMonth: string
    amountInCents: number
    installmentNumber?: number
    installmentCount?: number
    status: EntryStatus
    completedAt?: string
}
