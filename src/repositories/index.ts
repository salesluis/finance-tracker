import { ApiFinanceRepository } from './api-finance-repository'
import type { FinanceRepository } from './finance-repository'
import { MockFinanceRepository } from './mock-finance-repository'

export interface FinanceRepositoryConfig {
    dataSource?: string
    apiBaseUrl?: string
}

/** Creates the persistence adapter without leaking environment access into application code. */
export function createFinanceRepository(config: FinanceRepositoryConfig): FinanceRepository {
    const dataSource = config.dataSource || 'mock'
    if (dataSource === 'mock') return new MockFinanceRepository()
    if (dataSource === 'api') {
        if (!config.apiBaseUrl) throw new Error('VITE_API_BASE_URL é obrigatória quando VITE_DATA_SOURCE=api.')
        return new ApiFinanceRepository({ baseUrl: config.apiBaseUrl })
    }
    throw new Error(`VITE_DATA_SOURCE inválida: ${dataSource}. Use "mock" ou "api".`)
}

export const financeRepository = createFinanceRepository({
    dataSource: import.meta.env.VITE_DATA_SOURCE,
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
})
