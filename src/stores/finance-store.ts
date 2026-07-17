import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { financeRepository } from '@/repositories'
import type {
    Category,
    CreateEntryInput,
    EntryStatus,
    FinancialEntry,
    FinancialOccurrence,
    UpdateEntryInput,
} from '@/types/finance'

export const useFinanceStore = defineStore('finance', () => {
    const categories = ref<Category[]>([]),
        entries = ref<FinancialEntry[]>([]),
        occurrences = ref<FinancialOccurrence[]>([])
    const loading = ref(false),
        error = ref<string | null>(null),
        initialized = ref(false)
    async function refresh() {
        // Commit the three resources together so a failed request never exposes a partially refreshed state.
        const [nextCategories, nextEntries, nextOccurrences] = await Promise.all([
            financeRepository.getCategories(),
            financeRepository.getEntries(),
            financeRepository.getOccurrences(),
        ])
        categories.value = nextCategories
        entries.value = nextEntries
        occurrences.value = nextOccurrences
    }
    async function run<T>(action: () => Promise<T>) {
        loading.value = true
        error.value = null
        try {
            const result = await action()
            await refresh()
            return result
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Não foi possível concluir a operação.'
            throw e
        } finally {
            loading.value = false
        }
    }
    async function initialize() {
        if (initialized.value) return
        loading.value = true
        try {
            await refresh()
            initialized.value = true
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Erro ao carregar dados.'
        } finally {
            loading.value = false
        }
    }
    async function ensureOccurrencesThroughYear(year: number) {
        await financeRepository.ensureOccurrencesThroughYear(year)
        await refresh()
    }
    const categoryMap = computed(() => new Map(categories.value.map((c) => [c.id, c])))
    const entryMap = computed(() => new Map(entries.value.map((e) => [e.id, e])))
    return {
        categories,
        entries,
        occurrences,
        loading,
        error,
        initialized,
        categoryMap,
        entryMap,
        initialize,
        ensureOccurrencesThroughYear,
        createEntry: (input: CreateEntryInput) => run(() => financeRepository.createEntry(input)),
        updateEntry: (id: string, input: UpdateEntryInput) =>
            run(() => financeRepository.updateEntry(id, input)),
        deleteEntry: (id: string) => run(() => financeRepository.deleteEntry(id)),
        updateStatus: (id: string, status: EntryStatus) =>
            run(() => financeRepository.updateOccurrenceStatus(id, status)),
    }
})
