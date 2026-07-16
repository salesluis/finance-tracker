<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { X } from '@lucide/vue'
import { useFinanceStore } from '@/stores/finance-store'
import type { CreateEntryInput, EntryType, FinancialEntry, RecurrenceType } from '@/types/finance'
const props = defineProps<{ open: boolean; type: EntryType; entry?: FinancialEntry }>()
const emit = defineEmits<{ close: []; saved: [] }>()
const store = useFinanceStore()
const blank = () => ({
    description: '',
    categoryId: '',
    amount: 0,
    startDate: new Date().toISOString().slice(0, 10),
    recurrenceType: 'single' as RecurrenceType,
    initialInstallment: 1,
    installmentCount: 2,
    account: '',
    notes: '',
})
const form = reactive(blank())
const errors = reactive<Record<string, string>>({})
watch(
    () => [props.open, props.entry] as const,
    () => {
        if (!props.open) return
        Object.assign(form, blank(), props.entry ?? {})
        for (const k in errors) delete errors[k]
    },
    { immediate: true },
)
const available = computed(() => store.categories.filter((c) => c.type === props.type))
function validate() {
    for (const k in errors) delete errors[k]
    if (!form.description.trim()) errors.description = 'Informe uma descrição.'
    if (!form.categoryId) errors.categoryId = 'Selecione uma categoria.'
    if (!(form.amount > 0)) errors.amount = 'Informe um valor maior que zero.'
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) errors.startDate = 'Informe uma data válida.'
    if (
        form.recurrenceType === 'installment' &&
        (!(form.initialInstallment >= 1) || !(form.installmentCount >= form.initialInstallment))
    )
        errors.installments = 'A parcela inicial deve estar entre 1 e o total.'
    return !Object.keys(errors).length
}
async function submit() {
    if (!validate()) return
    const input: CreateEntryInput = {
        description: form.description.trim(),
        type: props.type,
        categoryId: form.categoryId,
        amount: Number(form.amount),
        startDate: form.startDate,
        recurrenceType: form.recurrenceType,
        account: form.account.trim() || undefined,
        notes: form.notes.trim() || undefined,
        ...(form.recurrenceType === 'installment'
            ? {
                  initialInstallment: Number(form.initialInstallment),
                  installmentCount: Number(form.installmentCount),
              }
            : {}),
    }
    if (props.entry) await store.updateEntry(props.entry.id, input)
    else await store.createEntry(input)
    emit('saved')
    emit('close')
}
</script>
<template>
    <Teleport to="body"
        ><div
            v-if="open"
            class="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm"
            @click.self="emit('close')"
        >
            <section
                class="h-full w-full max-w-lg overflow-y-auto border-l border-line bg-[#171719] p-6 shadow-2xl"
            >
                <div class="mb-7 flex items-start justify-between">
                    <div>
                        <h2 class="text-xl font-semibold">
                            {{ entry ? 'Editar' : 'Novo' }}
                            {{ type === 'expense' ? 'despesa' : 'receita' }}
                        </h2>
                        <p class="mt-1 text-sm text-zinc-500">
                            Cadastre o compromisso; as ocorrências serão geradas automaticamente.
                        </p>
                    </div>
                    <button class="btn-ghost !size-10 !p-0" @click="emit('close')">
                        <X :size="18" />
                    </button>
                </div>
                <form class="space-y-5" @submit.prevent="submit">
                    <div>
                        <label class="label">Descrição</label
                        ><input
                            v-model="form.description"
                            class="field"
                            placeholder="Ex.: Internet"
                        />
                        <p v-if="errors.description" class="mt-1 text-xs text-rose-400">
                            {{ errors.description }}
                        </p>
                    </div>
                    <div>
                        <label class="label">Categoria</label
                        ><select v-model="form.categoryId" class="field">
                            <option value="" disabled>Selecione</option>
                            <option v-for="c in available" :key="c.id" :value="c.id">
                                {{ c.name }}
                            </option>
                        </select>
                        <p v-if="errors.categoryId" class="mt-1 text-xs text-rose-400">
                            {{ errors.categoryId }}
                        </p>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="label">Valor</label
                            ><input
                                v-model.number="form.amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                class="field"
                            />
                            <p v-if="errors.amount" class="mt-1 text-xs text-rose-400">
                                {{ errors.amount }}
                            </p>
                        </div>
                        <div>
                            <label class="label">Data inicial</label
                            ><input v-model="form.startDate" type="date" class="field" />
                        </div>
                    </div>
                    <div>
                        <label class="label">Recorrência</label
                        ><select v-model="form.recurrenceType" class="field">
                            <option value="single">Única</option>
                            <option v-if="type === 'expense'" value="installment">Parcelada</option>
                            <option value="monthly">Mensal</option>
                        </select>
                    </div>
                    <div
                        v-if="form.recurrenceType === 'installment'"
                        class="grid grid-cols-2 gap-4"
                    >
                        <div>
                            <label class="label">Parcela inicial</label
                            ><input
                                v-model.number="form.initialInstallment"
                                type="number"
                                min="1"
                                class="field"
                            />
                        </div>
                        <div>
                            <label class="label">Total de parcelas</label
                            ><input
                                v-model.number="form.installmentCount"
                                type="number"
                                min="1"
                                class="field"
                            />
                        </div>
                        <p v-if="errors.installments" class="col-span-2 text-xs text-rose-400">
                            {{ errors.installments }}
                        </p>
                    </div>
                    <div v-if="type === 'expense'">
                        <label class="label">Conta</label
                        ><input
                            v-model="form.account"
                            class="field"
                            placeholder="Ex.: Cartão principal"
                        />
                    </div>
                    <div>
                        <label class="label">Observação</label
                        ><textarea
                            v-model="form.notes"
                            rows="3"
                            class="field !h-auto py-3"
                            placeholder="Opcional"
                        />
                    </div>
                    <div class="flex justify-end gap-3 border-t border-line pt-6">
                        <button type="button" class="btn-secondary" @click="emit('close')">
                            Cancelar</button
                        ><button class="btn-primary" :disabled="store.loading">
                            {{ store.loading ? 'Salvando…' : 'Salvar' }}
                        </button>
                    </div>
                </form>
            </section>
        </div></Teleport
    >
</template>
