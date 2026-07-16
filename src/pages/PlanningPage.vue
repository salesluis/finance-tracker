<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue'
import PageHeader from '@/components/PageHeader.vue'
import { useFinanceStore } from '@/stores/finance-store'
import { annualSeries } from '@/services/finance-calculator'
import { formatCurrency, monthNames } from '@/lib/format'
const store = useFinanceStore()
const year = ref(new Date().getFullYear())
const data = computed(() => annualSeries(store.entries, store.occurrences, year.value, 'forecast'))
async function ensure() {
    await store.ensureYear(year.value)
}
watch(year, ensure)
onMounted(ensure)
</script>
<template>
    <PageHeader
        title="Planejamento anual"
        description="Projeção calculada automaticamente a partir dos seus lançamentos."
    />
    <div class="mb-5">
        <label class="label">Ano</label
        ><input v-model.number="year" class="field !w-32" type="number" min="2020" max="2100" />
    </div>
    <div class="table-shell">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Mês</th>
                    <th>Receita</th>
                    <th>Despesa</th>
                    <th>Saldo</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="row in data" :key="row.month">
                    <td class="font-medium !text-zinc-100">{{ monthNames[row.month] }}</td>
                    <td class="text-emerald-400">{{ formatCurrency(row.income) }}</td>
                    <td class="text-rose-400">{{ formatCurrency(row.expense) }}</td>
                    <td
                        class="font-semibold"
                        :class="row.balance >= 0 ? 'text-zinc-100' : 'text-rose-400'"
                    >
                        {{ formatCurrency(row.balance) }}
                    </td>
                </tr>
            </tbody>
            <tfoot>
                <tr class="bg-zinc-900/70 font-semibold">
                    <td class="px-5 py-4">Total</td>
                    <td class="px-5 py-4 text-emerald-400">
                        {{ formatCurrency(data.reduce((a, r) => a + r.income, 0)) }}
                    </td>
                    <td class="px-5 py-4 text-rose-400">
                        {{ formatCurrency(data.reduce((a, r) => a + r.expense, 0)) }}
                    </td>
                    <td class="px-5 py-4">
                        {{ formatCurrency(data.reduce((a, r) => a + r.balance, 0)) }}
                    </td>
                </tr>
            </tfoot>
        </table>
    </div>
</template>
