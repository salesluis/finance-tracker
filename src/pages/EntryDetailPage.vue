<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Edit3, Trash2 } from '@lucide/vue'
import { useFinanceStore } from '@/stores/finance-store'
import { formatCurrency, formatDate, monthNames, occurrenceDate } from '@/lib/format'
import CategoryBadge from '@/components/CategoryBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import EntryForm from '@/components/EntryForm.vue'
import type { EntryStatus, EntryType } from '@/types/finance'
const props = defineProps<{ type: EntryType }>()
const store = useFinanceStore(),
    route = useRoute(),
    router = useRouter(),
    formOpen = ref(false)
const entry = computed(() =>
    store.entries.find((e) => e.id === route.params.id && e.type === props.type),
)
const history = computed(() =>
    store.occurrences
        .filter((o) => o.entryId === entry.value?.id)
        .sort((a, b) => b.referenceMonth.localeCompare(a.referenceMonth)),
)
async function setStatus(id: string, status: EntryStatus) {
    await store.updateStatus(id, status)
}
async function remove() {
    if (entry.value && confirm(`Excluir “${entry.value.description}” e todo o histórico?`)) {
        await store.deleteEntry(entry.value.id)
        router.push(props.type === 'expense' ? '/despesas' : '/receitas')
    }
}
</script>
<template>
    <div v-if="entry">
        <button class="btn-ghost mb-5 !px-0" @click="router.back()">
            <ArrowLeft :size="17" />Voltar
        </button>
        <div class="mb-7 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div>
                <div class="mb-3 flex items-center gap-3">
                    <CategoryBadge :category="store.categoryMap.get(entry.categoryId)" /><span
                        class="text-xs uppercase tracking-wider text-zinc-600"
                        >{{
                            entry.recurrenceType === 'monthly'
                                ? 'Mensal'
                                : entry.recurrenceType === 'installment'
                                  ? 'Parcelada'
                                  : 'Única'
                        }}</span
                    >
                </div>
                <h1 class="text-3xl font-semibold">{{ entry.description }}</h1>
                <p
                    class="mt-2 text-2xl font-medium"
                    :class="type === 'income' ? 'text-emerald-400' : 'text-rose-400'"
                >
                    {{ formatCurrency(entry.amountInCents) }}
                </p>
            </div>
            <div class="flex gap-2">
                <button class="btn-secondary" @click="formOpen = true">
                    <Edit3 :size="16" />Editar</button
                ><button class="btn-secondary text-rose-400" @click="remove">
                    <Trash2 :size="16" />Excluir
                </button>
            </div>
        </div>
        <div class="mb-7 grid gap-4 sm:grid-cols-3">
            <div class="card p-5">
                <span class="text-xs text-zinc-600">Data inicial</span>
                <p class="mt-2 text-sm font-medium">{{ formatDate(entry.startDate) }}</p>
            </div>
            <div class="card p-5">
                <span class="text-xs text-zinc-600">Conta</span>
                <p class="mt-2 text-sm font-medium">{{ entry.account || 'Não informada' }}</p>
            </div>
            <div class="card p-5">
                <span class="text-xs text-zinc-600">Observação</span>
                <p class="mt-2 text-sm font-medium">{{ entry.notes || 'Nenhuma observação' }}</p>
            </div>
        </div>
        <h2 class="mb-4 text-lg font-semibold">Histórico de ocorrências</h2>
        <div class="table-shell">
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Mês</th>
                        <th>Parcela</th>
                        <th>Valor</th>
                        <th>Vencimento</th>
                        <th>Status</th>
                        <th>Alterar status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="o in history" :key="o.id">
                        <td>
                            {{ monthNames[Number(o.referenceMonth.slice(5)) - 1] }}
                            {{ o.referenceMonth.slice(0, 4) }}
                        </td>
                        <td>
                            {{
                                o.installmentNumber
                                    ? `${o.installmentNumber}/${o.installmentCount}`
                                    : '—'
                            }}
                        </td>
                        <td>{{ formatCurrency(o.amountInCents) }}</td>
                        <td>{{ formatDate(occurrenceDate(o.referenceMonth, entry.startDate)) }}</td>
                        <td><StatusBadge :status="o.status" /></td>
                        <td>
                            <select
                                :value="o.status"
                                class="field !h-9 !w-auto"
                                @change="
                                    setStatus(
                                        o.id,
                                        ($event.target as HTMLSelectElement).value as EntryStatus,
                                    )
                                "
                            >
                                <option value="planned">Planejado</option>
                                <option :value="type === 'expense' ? 'paid' : 'received'">
                                    {{ type === 'expense' ? 'Pago' : 'Recebido' }}
                                </option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
        <EntryForm :open="formOpen" :type="type" :entry="entry" @close="formOpen = false" />
    </div>
    <div v-else-if="store.initialized" class="card grid min-h-80 place-items-center text-center">
        <div>
            <h1 class="text-xl font-semibold">Lançamento não encontrado</h1>
            <RouterLink
                class="btn-primary mt-5"
                :to="type === 'expense' ? '/despesas' : '/receitas'"
                >Voltar à lista</RouterLink
            >
        </div>
    </div>
</template>
