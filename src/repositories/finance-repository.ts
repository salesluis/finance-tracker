import type {
    Category,
    CreateEntryInput,
    EntryStatus,
    FinancialEntry,
    FinancialOccurrence,
    UpdateEntryInput,
} from '@/types/finance'

export interface FinanceRepository {
    /** Returns detached domain objects so callers cannot mutate the persistence layer by reference. */
    getCategories(): Promise<Category[]>
    /** Lists all financial entry definitions, including their recurrence configuration. */
    getEntries(): Promise<FinancialEntry[]>
    /** Lists the generated occurrences currently available in the data source. */
    getOccurrences(): Promise<FinancialOccurrence[]>
    /**
     * Idempotently creates any missing occurrences through the end of `year`.
     * The API owns this rule in production; the mock reproduces it locally.
     */
    ensureOccurrencesThroughYear(year: number): Promise<void>
    /** Creates an entry. Monetary values in `input` are integer BRL cents. */
    createEntry(input: CreateEntryInput): Promise<FinancialEntry>
    /** Partially updates an entry while preserving fields omitted from `input`. */
    updateEntry(id: string, input: UpdateEntryInput): Promise<FinancialEntry>
    /** Deletes an entry and all occurrences owned by it. */
    deleteEntry(id: string): Promise<void>
    /** Changes an occurrence status and returns the persisted occurrence. */
    updateOccurrenceStatus(id: string, status: EntryStatus): Promise<FinancialOccurrence>
}
