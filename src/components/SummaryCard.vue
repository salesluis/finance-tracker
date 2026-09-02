<script setup lang="ts">
import type { Component } from 'vue'
defineProps<{
    label: string
    value: string
    hint?: string
    tone?: 'green' | 'red' | 'neutral'
    icon: Component
}>()
</script>
<template>
    <article class="card p-5">
        <div class="mb-5 flex items-center justify-between">
            <span class="text-sm text-zinc-500">{{ label }}</span
            ><span class="grid size-9 place-items-center rounded-xl bg-zinc-800 text-zinc-400"
                ><component :is="icon" :size="18"
            /></span>
        </div>
        <strong
            class="text-2xl font-semibold tracking-tight"
            :class="tone === 'green' ? 'text-emerald-400' : tone === 'red' ? 'text-rose-400' : 'text-zinc-100'"
            >{{ value }}</strong
        >
        <p v-if="hint" class="mt-2 text-xs text-zinc-600">{{ hint }}</p>
    </article>
</template>
