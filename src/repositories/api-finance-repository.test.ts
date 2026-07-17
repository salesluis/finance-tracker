import { describe, expect, it, vi } from 'vitest'
import { ApiFinanceRepository } from './api-finance-repository'
import { financeRepositoryReadContract } from './finance-repository.contract'
import { RepositoryError } from './repository-error'
import type { CategoryDto, FinancialEntryDto, FinancialOccurrenceDto } from './api-finance-dtos'

const category: CategoryDto = {
    id: 'home',
    name: 'Casa',
    type: 'expense',
    backgroundColor: '#000000',
    foregroundColor: '#ffffff',
    markerName: 'circle',
}
const entry: FinancialEntryDto = {
    id: 'internet',
    description: 'Internet',
    type: 'expense',
    categoryId: 'home',
    amountInCents: 9000,
    startDate: '2026-01-10',
    recurrenceType: 'monthly',
}
const occurrence: FinancialOccurrenceDto = {
    id: 'internet:2026-01:r',
    entryId: 'internet',
    referenceMonth: '2026-01',
    amountInCents: 9000,
    status: 'planned',
}
const json = (value: unknown, status = 200) =>
    new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } })

function readFetch() {
    return vi.fn(async (input: string | URL | Request) => {
        const path = new URL(String(input)).pathname
        if (path.endsWith('/categories')) return json([category])
        if (path.endsWith('/entries')) return json([entry])
        if (path.endsWith('/occurrences')) return json([occurrence])
        return json({}, 404)
    })
}

financeRepositoryReadContract(
    'ApiFinanceRepository',
    () => new ApiFinanceRepository({ baseUrl: 'https://example.test/api/v1/', fetch: readFetch() as typeof fetch }),
)

describe('ApiFinanceRepository', () => {
    it('maps every mutation to the documented method, route and body', async () => {
        const fetchMock = vi
            .fn()
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(json(entry, 201))
            .mockResolvedValueOnce(json({ ...entry, description: 'Fibra' }))
            .mockResolvedValueOnce(new Response(null, { status: 204 }))
            .mockResolvedValueOnce(json({ ...occurrence, status: 'paid', completedAt: '2026-01-10' }))
        const repository = new ApiFinanceRepository({
            baseUrl: 'https://example.test/api/v1/',
            fetch: fetchMock as typeof fetch,
        })
        const input = { ...entry }
        delete (input as Partial<FinancialEntryDto>).id

        await repository.ensureOccurrencesThroughYear(2027)
        expect(await repository.createEntry(input)).toEqual(entry)
        expect(await repository.updateEntry('internet / 1', { description: 'Fibra' })).toMatchObject({
            description: 'Fibra',
        })
        await repository.deleteEntry('internet / 1')
        expect(await repository.updateOccurrenceStatus('occurrence / 1', 'paid')).toMatchObject({ status: 'paid' })

        expect(fetchMock).toHaveBeenNthCalledWith(
            1,
            'https://example.test/api/v1/occurrences/ensure-year',
            expect.objectContaining({ method: 'POST', body: JSON.stringify({ year: 2027 }) }),
        )
        expect(fetchMock).toHaveBeenNthCalledWith(
            2,
            'https://example.test/api/v1/entries',
            expect.objectContaining({ method: 'POST', body: JSON.stringify(input) }),
        )
        expect(fetchMock).toHaveBeenNthCalledWith(
            3,
            'https://example.test/api/v1/entries/internet%20%2F%201',
            expect.objectContaining({ method: 'PATCH' }),
        )
        expect(fetchMock).toHaveBeenNthCalledWith(
            4,
            'https://example.test/api/v1/entries/internet%20%2F%201',
            expect.objectContaining({ method: 'DELETE' }),
        )
        expect(fetchMock).toHaveBeenNthCalledWith(
            5,
            'https://example.test/api/v1/occurrences/occurrence%20%2F%201/status',
            expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ status: 'paid' }) }),
        )
    })

    it('normalizes Problem Details responses', async () => {
        const response = json(
            {
                title: 'Dados inválidos',
                status: 422,
                detail: 'Corrija os campos informados.',
                code: 'VALIDATION_ERROR',
                errors: { amountInCents: ['Deve ser positivo.'] },
            },
            422,
        )
        const repository = new ApiFinanceRepository({
            baseUrl: 'https://example.test/api/v1',
            fetch: vi.fn().mockResolvedValue(response) as typeof fetch,
        })

        const error = await repository.getEntries().catch((caught) => caught)

        expect(error).toBeInstanceOf(RepositoryError)
        expect(error).toMatchObject({
            message: 'Corrija os campos informados.',
            code: 'VALIDATION_ERROR',
            status: 422,
            fieldErrors: { amountInCents: ['Deve ser positivo.'] },
        })
    })

    it('normalizes network failures and invalid success payloads', async () => {
        const offline = new ApiFinanceRepository({
            baseUrl: 'https://example.test/api/v1',
            fetch: vi.fn().mockRejectedValue(new TypeError('offline')) as typeof fetch,
        })
        const invalid = new ApiFinanceRepository({
            baseUrl: 'https://example.test/api/v1',
            fetch: vi.fn().mockResolvedValue(new Response('not-json')) as typeof fetch,
        })

        await expect(offline.getEntries()).rejects.toMatchObject({ code: 'NETWORK_ERROR' })
        await expect(invalid.getEntries()).rejects.toMatchObject({ code: 'INVALID_RESPONSE' })
    })
})
