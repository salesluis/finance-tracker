export interface ProblemDetails {
    type?: string
    title?: string
    status?: number
    detail?: string
    code?: string
    errors?: Record<string, string[]>
}

/** Transport-independent error exposed by repository implementations. */
export class RepositoryError extends Error {
    constructor(
        message: string,
        readonly code: string,
        readonly status?: number,
        readonly fieldErrors?: Record<string, string[]>,
        options?: ErrorOptions,
    ) {
        super(message, options)
        this.name = 'RepositoryError'
    }
}
