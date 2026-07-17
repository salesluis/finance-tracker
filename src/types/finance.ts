export type EntryType = 'income' | 'expense'
export type EntryStatus = 'planned' | 'paid' | 'received'
export type RecurrenceType = 'single' | 'installment' | 'monthly'

export interface Category {
    id: string
    name: string
    type: EntryType
    backgroundColor: string
    foregroundColor: string
    markerName: string
}
export interface FinancialEntry {
    id: string
    description: string
    type: EntryType
    categoryId: string
    /** Monetary value in integer BRL cents. Example: 4590 represents R$ 45,90. */
    amountInCents: number
    startDate: string
    recurrenceType: RecurrenceType
    initialInstallment?: number
    installmentCount?: number
    account?: string
    notes?: string
}
export interface FinancialOccurrence {
    id: string
    entryId: string
    referenceMonth: string
    /** Monetary value in integer BRL cents. */
    amountInCents: number
    installmentNumber?: number
    installmentCount?: number
    status: EntryStatus
    completedAt?: string
}
export type CreateEntryInput = Omit<FinancialEntry, 'id'>
export type UpdateEntryInput = Partial<CreateEntryInput>
export interface FinanceSnapshot {
    categories: Category[]
    entries: FinancialEntry[]
    occurrences: FinancialOccurrence[]
    generatedThrough: Record<string, number>
}
export type ViewMode = 'actual' | 'forecast'
