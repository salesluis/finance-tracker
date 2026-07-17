import { categories } from '@/mocks/categories'
import { entries } from '@/mocks/entries'
import { occurrences } from '@/mocks/occurrences'
import { generateOccurrences } from '@/services/occurrence-generator'
import { uid } from '@/lib/format'
import type {
    CreateEntryInput,
    EntryStatus,
    FinanceSnapshot,
    UpdateEntryInput,
} from '@/types/finance'
import type { FinanceRepository } from './finance-repository'

const KEY = 'finance-tracker:v2'
const LEGACY_KEY = 'finance-tracker:v1'
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x))

type LegacySnapshot = Omit<FinanceSnapshot, 'entries' | 'occurrences'> & {
    entries: Array<Omit<FinanceSnapshot['entries'][number], 'amountInCents'> & { amount: number }>
    occurrences: Array<Omit<FinanceSnapshot['occurrences'][number], 'amountInCents'> & { amount: number }>
}

export class MockFinanceRepository implements FinanceRepository {
    private read(): FinanceSnapshot {
        const raw = localStorage.getItem(KEY)
        if (raw) return JSON.parse(raw)
        const legacyRaw = localStorage.getItem(LEGACY_KEY)
        if (legacyRaw) {
            const legacy = JSON.parse(legacyRaw) as LegacySnapshot
            const migrated: FinanceSnapshot = {
                ...legacy,
                entries: legacy.entries.map(({ amount, ...entry }) => ({
                    ...entry,
                    amountInCents: Math.round(amount * 100),
                })),
                occurrences: legacy.occurrences.map(({ amount, ...occurrence }) => ({
                    ...occurrence,
                    amountInCents: Math.round(amount * 100),
                })),
            }
            this.write(migrated)
            return migrated
        }
        const seed = {
            categories: clone(categories),
            entries: clone(entries),
            occurrences: clone(occurrences),
            generatedThrough: Object.fromEntries(entries.map((e) => [e.id, 2026])),
        }
        this.write(seed)
        return seed
    }
    private write(data: FinanceSnapshot) {
        localStorage.setItem(KEY, JSON.stringify(data))
    }
    async getCategories() {
        return clone(this.read().categories)
    }
    async getEntries() {
        return clone(this.read().entries)
    }
    async getOccurrences() {
        return clone(this.read().occurrences)
    }
    async ensureOccurrencesThroughYear(year: number) {
        const data = this.read()
        for (const entry of data.entries) {
            if ((data.generatedThrough[entry.id] ?? 0) >= year) continue
            const existing = new Set(data.occurrences.map((o) => o.id))
            data.occurrences.push(
                ...generateOccurrences(entry, year).filter((o) => !existing.has(o.id)),
            )
            data.generatedThrough[entry.id] = year
        }
        this.write(data)
    }
    async createEntry(input: CreateEntryInput) {
        const data = this.read()
        const entry = { ...input, id: uid() }
        data.entries.push(entry)
        const year = Math.max(new Date().getFullYear(), Number(entry.startDate.slice(0, 4)))
        data.occurrences.push(...generateOccurrences(entry, year))
        data.generatedThrough[entry.id] = year
        this.write(data)
        return clone(entry)
    }
    async updateEntry(id: string, input: UpdateEntryInput) {
        const data = this.read()
        const index = data.entries.findIndex((e) => e.id === id)
        if (index < 0) throw new Error('Lançamento não encontrado.')
        const updated = { ...data.entries[index], ...input, id }
        data.entries[index] = updated
        const completed = data.occurrences.filter((o) => o.entryId === id && o.status !== 'planned')
        const other = data.occurrences.filter((o) => o.entryId !== id)
        const through = data.generatedThrough[id] ?? new Date().getFullYear()
        const completedIds = new Set(completed.map((o) => o.id))
        const planned = generateOccurrences(updated, through).filter((o) => !completedIds.has(o.id))
        data.occurrences = [...other, ...completed, ...planned]
        this.write(data)
        return clone(updated)
    }
    async deleteEntry(id: string) {
        const data = this.read()
        data.entries = data.entries.filter((e) => e.id !== id)
        data.occurrences = data.occurrences.filter((o) => o.entryId !== id)
        delete data.generatedThrough[id]
        this.write(data)
    }
    async updateOccurrenceStatus(id: string, status: EntryStatus) {
        const data = this.read()
        const o = data.occurrences.find((x) => x.id === id)
        if (!o) throw new Error('Ocorrência não encontrada.')
        const entry = data.entries.find((e) => e.id === o.entryId)
        if (
            !entry ||
            (entry.type === 'expense' && status === 'received') ||
            (entry.type === 'income' && status === 'paid')
        )
            throw new Error('Status incompatível com o lançamento.')
        o.status = status
        o.completedAt = status === 'planned' ? undefined : new Date().toISOString().slice(0, 10)
        this.write(data)
        return clone(o)
    }
}
