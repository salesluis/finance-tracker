import type {
    CreateEntryInput,
    EntryStatus,
    FinancialEntry,
    FinancialOccurrence,
    UpdateEntryInput,
} from '@/types/finance'
import type { CategoryDto, FinancialEntryDto, FinancialOccurrenceDto } from './api-finance-dtos'
import type { FinanceRepository } from './finance-repository'
import { RepositoryError, type ProblemDetails } from './repository-error'

type FetchImplementation = typeof fetch

/** Configuration is injected so the adapter can be tested without a real server. */
export interface ApiFinanceRepositoryOptions {
    baseUrl: string
    fetch?: FetchImplementation
}

/** REST adapter for the `/api/v1` contract documented in `docs/data-repositories.md`. */
export class ApiFinanceRepository implements FinanceRepository {
    private readonly baseUrl: string
    private readonly fetch: FetchImplementation

    constructor(options: ApiFinanceRepositoryOptions) {
        const baseUrl = options.baseUrl.trim().replace(/\/+$/, '')
        if (!baseUrl) throw new Error('A URL base da API financeira é obrigatória.')
        this.baseUrl = baseUrl
        this.fetch = options.fetch ?? globalThis.fetch.bind(globalThis)
    }

    getCategories() {
        return this.request<CategoryDto[]>('/categories').then((categories) =>
            categories.map((category) => ({ ...category })),
        )
    }

    getEntries() {
        return this.request<FinancialEntryDto[]>('/entries').then((entries) => entries.map(this.toEntry))
    }

    getOccurrences() {
        return this.request<FinancialOccurrenceDto[]>('/occurrences').then((occurrences) =>
            occurrences.map(this.toOccurrence),
        )
    }

    async ensureOccurrencesThroughYear(year: number) {
        await this.request<void>('/occurrences/ensure-year', {
            method: 'POST',
            body: JSON.stringify({ year }),
        })
    }

    createEntry(input: CreateEntryInput) {
        return this.request<FinancialEntryDto>('/entries', {
            method: 'POST',
            body: JSON.stringify(input),
        }).then(this.toEntry)
    }

    updateEntry(id: string, input: UpdateEntryInput) {
        return this.request<FinancialEntryDto>(`/entries/${encodeURIComponent(id)}`, {
            method: 'PATCH',
            body: JSON.stringify(input),
        }).then(this.toEntry)
    }

    async deleteEntry(id: string) {
        await this.request<void>(`/entries/${encodeURIComponent(id)}`, { method: 'DELETE' })
    }

    updateOccurrenceStatus(id: string, status: EntryStatus) {
        return this.request<FinancialOccurrenceDto>(`/occurrences/${encodeURIComponent(id)}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        }).then(this.toOccurrence)
    }

    private readonly toEntry = (dto: FinancialEntryDto): FinancialEntry => ({ ...dto })

    private readonly toOccurrence = (dto: FinancialOccurrenceDto): FinancialOccurrence => ({ ...dto })

    private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
        let response: Response
        try {
            response = await this.fetch(`${this.baseUrl}${path}`, {
                ...init,
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...init.headers },
            })
        } catch (cause) {
            throw new RepositoryError(
                'Não foi possível conectar à API financeira.',
                'NETWORK_ERROR',
                undefined,
                undefined,
                {
                    cause,
                },
            )
        }

        if (!response.ok) throw await this.toRepositoryError(response)
        if (response.status === 204) return undefined as T

        try {
            return (await response.json()) as T
        } catch (cause) {
            throw new RepositoryError(
                'A API retornou uma resposta inválida.',
                'INVALID_RESPONSE',
                response.status,
                undefined,
                {
                    cause,
                },
            )
        }
    }

    private async toRepositoryError(response: Response) {
        let problem: ProblemDetails = {}
        try {
            problem = (await response.json()) as ProblemDetails
        } catch {
            // A status-based fallback keeps transport failures useful even if the server violates the contract.
        }
        return new RepositoryError(
            problem.detail ?? problem.title ?? `A API recusou a operação (${response.status}).`,
            problem.code ?? 'API_ERROR',
            response.status,
            problem.errors,
        )
    }
}
