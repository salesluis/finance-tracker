<script setup lang="ts">
import type { Category } from '@/types/finance'
defineProps<{ category?: Category }>()
</script>
<template>
    <span
        v-if="category"
        class="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold"
        :style="{ backgroundColor: category.backgroundColor, color: category.foregroundColor }"
    >
        <i class="size-1.5 rounded-full bg-current" />{{ category.name }}
    </span>
    <span v-else class="text-zinc-600">Sem categoria</span>
</template>
