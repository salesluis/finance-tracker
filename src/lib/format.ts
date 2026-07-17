const currency = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
/** Formats an integer amount of BRL cents for display. */
export const formatCurrency = (valueInCents: number) => currency.format(valueInCents / 100)
export const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro',
]
export function formatDate(date: string) {
    const [y, m, d] = date.slice(0, 10).split('-')
    return `${d}/${m}/${y}`
}
export function occurrenceDate(referenceMonth: string, startDate: string) {
    const [year, month] = referenceMonth.split('-').map(Number)
    const day = Number(startDate.slice(8, 10))
    const last = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return `${year}-${String(month).padStart(2, '0')}-${String(Math.min(day, last)).padStart(2, '0')}`
}
export const currentMonth = () => new Date().toISOString().slice(0, 7)
export const uid = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`
