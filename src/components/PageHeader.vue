<script setup lang="ts">
defineProps<{ eyebrow?: string; title: string; description: string }>()
</script>
<template>
    <div class="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
            <p
                v-if="eyebrow"
                class="mb-2 text-xs font-semibold uppercase tracking-[.2em] text-zinc-500"
            >
                {{ eyebrow }}
            </p>
            <h1 class="text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
                {{ title }}
            </h1>
            <p class="mt-2 max-w-2xl text-sm text-zinc-500">{{ description }}</p>
        </div>
        <slot />
    </div>
</template>
