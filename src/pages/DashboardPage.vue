<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { ArrowDownRight, ArrowUpRight, Scale, CalendarClock } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import SummaryCard from '@/components/SummaryCard.vue'
import FinanceLineChart from '@/components/FinanceLineChart.vue'
import CategoryPieChart from '@/components/CategoryPieChart.vue'
import CategoryBadge from '@/components/CategoryBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useFinanceStore } from '@/stores/finance-store'
import { annualSeries, categoryDistribution, monthlyTotals } from '@/services/finance-calculator'
import { currentMonth, formatCurrency, formatDate, monthNames, occurrenceDate } from '@/lib/format'
import type { ViewMode } from '@/types/finance'
const store = useFinanceStore()
const now = currentMonth()
const year = ref(Number(now.slice(0, 4))),
    month = ref(Number(now.slice(5))),
    mode = ref<ViewMode>('forecast')
const monthKey = computed(() => `${year.value}-${String(month.value).padStart(2, '0')}`)
const totals = computed(() =>
    monthlyTotals(store.entries, store.occurrences, monthKey.value, mode.value),
)
const series = computed(() =>
    annualSeries(store.entries, store.occurrences, year.value, mode.value),
)
const distribution = computed(() =>
    categoryDistribution(
        store.entries,
        store.occurrences,
        store.categories,
        monthKey.value,
        mode.value,
    ),
)
const availableYears = computed(() =>
    Array.from(
        new Set([
            year.value,
            ...store.occurrences.map((o) => Number(o.referenceMonth.slice(0, 4))),
        ]),
    ).sort(),
)
const movements = computed(() =>
    store.occurrences
        .filter((o) => o.referenceMonth === monthKey.value)
        .sort((a, b) => {
            const ea = store.entryMap.get(a.entryId),
                eb = store.entryMap.get(b.entryId)
            return (ea?.startDate.slice(8) ?? '').localeCompare(eb?.startDate.slice(8) ?? '')
        }),
)
async function ensure() {
    await store.ensureOccurrencesThroughYear(year.value)
}
watch(year, ensure)
onMounted(ensure)
</script>
<template>
    <PageHeader
        eyebrow="Seu dinheiro"
        title="Visão geral"
        description="Uma leitura simples do que entrou, saiu e ainda está por vir."
    />
    <section class="card mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-end">
        <div>
            <label class="label">Ano</label
            ><select v-model.number="year" class="field !w-32">
                <option v-for="y in availableYears" :key="y">{{ y }}</option>
                <option v-if="!availableYears.includes(year + 1)">{{ year + 1 }}</option>
            </select>
        </div>
        <div>
            <label class="label">Mês</label
            ><select v-model.number="month" class="field !w-44">
                <option v-for="(name, i) in monthNames" :key="name" :value="i + 1">
                    {{ name }}
                </option>
            </select>
        </div>
        <div class="sm:ml-auto">
            <label class="label">Visualização</label>
            <div class="flex rounded-xl border border-line bg-zinc-900 p-1">
                <button
                    class="rounded-lg px-3 py-2 text-xs"
                    :class="mode === 'actual' ? 'bg-zinc-700 text-white' : 'text-zinc-500'"
                    @click="mode = 'actual'"
                >
                    Realizado</button
                ><button
                    class="rounded-lg px-3 py-2 text-xs"
                    :class="mode === 'forecast' ? 'bg-zinc-700 text-white' : 'text-zinc-500'"
                    @click="mode = 'forecast'"
                >
                    Realizado + planejado
                </button>
            </div>
        </div>
    </section>
    <section class="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
            label="Receita do mês"
            :value="formatCurrency(totals.income)"
            tone="green"
            :icon="ArrowUpRight"
        /><SummaryCard
            label="Despesa do mês"
            :value="formatCurrency(totals.expense)"
            tone="red"
            :icon="ArrowDownRight"
        /><SummaryCard
            label="Saldo do mês"
            :value="formatCurrency(totals.balance)"
            :tone="totals.balance >= 0 ? 'green' : 'red'"
            :icon="Scale"
        /><SummaryCard
            label="Ainda planejado"
            :value="formatCurrency(totals.planned)"
            hint="Total planejado no mês"
            :icon="CalendarClock"
        />
    </section>
    <section class="mb-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <article class="card p-5">
            <div class="mb-2 flex items-center justify-between">
                <div>
                    <h2 class="font-semibold">Receitas e despesas</h2>
                    <p class="mt-1 text-xs text-zinc-600">Evolução mensal em {{ year }}</p>
                </div>
                <div class="flex gap-3 text-xs">
                    <span class="text-emerald-400">● Receita</span
                    ><span class="text-rose-400">● Despesa</span>
                </div>
            </div>
            <FinanceLineChart :data="series" />
        </article>
        <article class="card p-5">
            <h2 class="font-semibold">Despesas por categoria</h2>
            <p class="mt-1 text-xs text-zinc-600">
                Distribuição de {{ monthNames[month - 1].toLowerCase() }}
            </p>
            <CategoryPieChart :data="distribution" />
        </article>
    </section>
    <section>
        <div class="mb-4">
            <h2 class="text-lg font-semibold">Movimentações do mês</h2>
            <p class="mt-1 text-sm text-zinc-600">Todas as ocorrências ordenadas por vencimento.</p>
        </div>
        <div v-if="movements.length" class="table-shell">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Parcela</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="o in movements" :key="o.id">
                        <td class="font-medium !text-zinc-100">
                            {{ store.entryMap.get(o.entryId)?.description }}
                        </td>
                        <td>
                            <CategoryBadge
                                :category="
                                    store.categoryMap.get(
                                        store.entryMap.get(o.entryId)?.categoryId || '',
                                    )
                                "
                            />
                        </td>
                        <td>{{ formatCurrency(o.amountInCents) }}</td>
                        <td>
                            {{
                                formatDate(
                                    occurrenceDate(
                                        o.referenceMonth,
                                        store.entryMap.get(o.entryId)?.startDate ||
                                            `${o.referenceMonth}-01`,
                                    ),
                                )
                            }}
                        </td>
                        <td>
                            {{
                                o.installmentNumber
                                    ? `${o.installmentNumber}/${o.installmentCount}`
                                    : '—'
                            }}
                        </td>
                        <td><StatusBadge :status="o.status" /></td>
                    </tr>
                </tbody>
            </table>
        </div>
        <div v-else class="card grid h-40 place-items-center text-sm text-zinc-600">
            Nenhuma movimentação neste mês.
        </div>
    </section>
</template>
