import { describe, expect, it } from 'vitest'
import { ApiFinanceRepository } from './api-finance-repository'
import { createFinanceRepository } from './index'
import { MockFinanceRepository } from './mock-finance-repository'

describe('createFinanceRepository', () => {
    it('uses the mock by default', () => {
        expect(createFinanceRepository({})).toBeInstanceOf(MockFinanceRepository)
    })

    it('creates the API adapter and requires its base URL', () => {
        expect(
            createFinanceRepository({ dataSource: 'api', apiBaseUrl: 'https://example.test/api/v1' }),
        ).toBeInstanceOf(ApiFinanceRepository)
        expect(() => createFinanceRepository({ dataSource: 'api' })).toThrow('VITE_API_BASE_URL')
    })

    it('rejects unknown data sources', () => {
        expect(() => createFinanceRepository({ dataSource: 'database' })).toThrow('VITE_DATA_SOURCE inválida')
    })
})
