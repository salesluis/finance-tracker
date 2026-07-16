import type {
    Category,
    CreateEntryInput,
    EntryStatus,
    FinancialEntry,
    FinancialOccurrence,
    UpdateEntryInput,
} from '@/types/finance'

export interface FinanceRepository {
    getCategories(): Promise<Category[]>
    getEntries(): Promise<FinancialEntry[]>
    getOccurrences(): Promise<FinancialOccurrence[]>
    ensureYear(year: number): Promise<void>
    createEntry(input: CreateEntryInput): Promise<FinancialEntry>
    updateEntry(id: string, input: UpdateEntryInput): Promise<FinancialEntry>
    deleteEntry(id: string): Promise<void>
    updateOccurrenceStatus(id: string, status: EntryStatus): Promise<void>
}
