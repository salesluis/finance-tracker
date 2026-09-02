<script setup lang="ts">
import type { EntryStatus } from '@/types/finance'
defineProps<{ status: EntryStatus }>()
const labels = { planned: 'Planejado', paid: 'Pago', received: 'Recebido' }
</script>
<template>
    <span
        class="rounded-full border px-2.5 py-1 text-xs font-medium"
        :class="
            status === 'planned'
                ? 'border-amber-900/70 bg-amber-950/50 text-amber-300'
                : 'border-emerald-900/70 bg-emerald-950/50 text-emerald-300'
        "
        >{{ labels[status] }}
    </span>
</template>
