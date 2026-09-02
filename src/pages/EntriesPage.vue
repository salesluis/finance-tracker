<script setup lang="ts">
import { computed, ref } from 'vue'
import { Plus, Search, MoreHorizontal } from '@lucide/vue'
import PageHeader from '@/components/PageHeader.vue'
import EntryForm from '@/components/EntryForm.vue'
import CategoryBadge from '@/components/CategoryBadge.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useFinanceStore } from '@/stores/finance-store'
import { formatCurrency, formatDate, occurrenceDate } from '@/lib/format'
import type { EntryType, FinancialEntry } from '@/types/finance'
const props = defineProps<{ type: EntryType }>()
const store = useFinanceStore()
const query = ref('')
const formOpen = ref(false)
const editing = ref<FinancialEntry>()
const title = computed(() => (props.type === 'expense' ? 'Despesas' : 'Receitas'))
const entries = computed(() =>
    store.entries.filter(
        (e) => e.type === props.type && e.description.toLowerCase().includes(query.value.toLowerCase()),
    ),
)
function nextOccurrence(entry: FinancialEntry) {
    return store.occurrences
        .filter((o) => o.entryId === entry.id && o.status === 'planned')
        .sort((a, b) => a.referenceMonth.localeCompare(b.referenceMonth))[0]
}
function recurrence(entry: FinancialEntry) {
    return entry.recurrenceType === 'monthly'
        ? 'Mensal'
        : entry.recurrenceType === 'installment'
          ? 'Parcelada'
          : 'Única'
}
function edit(entry: FinancialEntry) {
    editing.value = entry
    formOpen.value = true
}
function close() {
    formOpen.value = false
    editing.value = undefined
}
async function remove(entry: FinancialEntry) {
    if (confirm(`Excluir “${entry.description}” e todo o seu histórico?`)) await store.deleteEntry(entry.id)
}
</script>
<template>
    <PageHeader
        :title="title"
        :description="
            type === 'expense'
                ? 'Acompanhe compromissos, parcelas e vencimentos.'
                : 'Organize entradas únicas e receitas recorrentes.'
        "
        ><button class="btn-primary" @click="formOpen = true"><Plus :size="16" />Novo lançamento</button></PageHeader
    >
    <div class="mb-5 flex items-center gap-3">
        <div class="relative max-w-sm flex-1">
            <Search class="absolute left-3 top-3 text-zinc-600" :size="17" /><input
                v-model="query"
                class="field pl-10"
                placeholder="Buscar por descrição"
            />
        </div>
        <span class="text-xs text-zinc-600">{{ entries.length }} lançamentos</span>
    </div>
    <div v-if="entries.length" class="table-shell">
        <table class="data-table">
            <thead>
                <tr>
                    <th>Descrição</th>
                    <th>Categoria</th>
                    <th>Valor</th>
                    <th>{{ type === 'expense' ? 'Recorrência / parcela' : 'Recorrência' }}</th>
                    <th>Próximo {{ type === 'expense' ? 'vencimento' : 'recebimento' }}</th>
                    <th>Status</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="entry in entries" :key="entry.id">
                    <td>
                        <RouterLink
                            :to="`${type === 'expense' ? '/despesas' : '/receitas'}/${entry.id}`"
                            class="font-medium text-zinc-100 hover:underline"
                            >{{ entry.description }}</RouterLink
                        ><small class="mt-1 block text-zinc-600">{{ entry.account || 'Sem conta informada' }}</small>
                    </td>
                    <td><CategoryBadge :category="store.categoryMap.get(entry.categoryId)" /></td>
                    <td class="font-medium !text-zinc-100">{{ formatCurrency(entry.amountInCents) }}</td>
                    <td>
                        {{
                            nextOccurrence(entry)?.installmentNumber
                                ? `${nextOccurrence(entry)?.installmentNumber}/${nextOccurrence(entry)?.installmentCount}`
                                : recurrence(entry)
                        }}
                    </td>
                    <td>
                        {{
                            nextOccurrence(entry)
                                ? formatDate(occurrenceDate(nextOccurrence(entry)!.referenceMonth, entry.startDate))
                                : '—'
                        }}
                    </td>
                    <td>
                        <StatusBadge v-if="nextOccurrence(entry)" :status="nextOccurrence(entry)!.status" /><span
                            v-else
                            class="text-xs text-zinc-600"
                            >Concluído</span
                        >
                    </td>
                    <td>
                        <div class="flex justify-end gap-1">
                            <button class="btn-ghost !h-8 !px-2" title="Editar" @click="edit(entry)">
                                <MoreHorizontal :size="17" /></button
                            ><button class="btn-ghost !h-8 !px-2 text-rose-400" @click="remove(entry)">Excluir</button>
                        </div>
                    </td>
                </tr>
            </tbody>
        </table>
    </div>
    <div v-else class="card grid min-h-72 place-items-center p-8 text-center">
        <div>
            <div class="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-zinc-800 text-zinc-500">
                <Plus />
            </div>
            <h2 class="font-medium">Nenhum lançamento encontrado</h2>
            <p class="mt-2 text-sm text-zinc-600">Cadastre um lançamento ou ajuste sua busca.</p>
        </div>
    </div>
    <EntryForm :open="formOpen" :type="type" :entry="editing" @close="close" />
</template>
