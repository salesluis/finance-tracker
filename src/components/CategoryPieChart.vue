<script setup lang="ts">
import { VisDonut, VisSingleContainer } from '@unovis/vue'
import type { Category } from '@/types/finance'
defineProps<{ data: { category: Category; value: number }[] }>()
const value = (d: { value: number }) => d.value
const color = (d: { category: Category }) => d.category.backgroundColor
</script>
<template>
    <div v-if="data.length" class="grid gap-5 sm:grid-cols-[1fr_150px] sm:items-center">
        <div class="h-56">
            <VisSingleContainer :data="data" height="100%"
                ><VisDonut :value="value" :color="color" :arc-width="32"
            /></VisSingleContainer>
        </div>
        <ul class="space-y-3">
            <li
                v-for="item in data"
                :key="item.category.id"
                class="flex items-center justify-between gap-3 text-xs text-zinc-400"
            >
                <span class="flex items-center gap-2"
                    ><i
                        class="size-2 rounded-full"
                        :style="{ background: item.category.backgroundColor }"
                    />{{ item.category.name }}</span
                ><b class="text-zinc-200"
                    >{{
                        Math.round((item.value / data.reduce((a, x) => a + x.value, 0)) * 100)
                    }}%</b
                >
            </li>
        </ul>
    </div>
    <div v-else class="grid h-56 place-items-center text-sm text-zinc-600">
        Sem despesas para este filtro.
    </div>
</template>
