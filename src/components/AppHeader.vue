<script setup lang="ts">
import { WalletCards } from '@lucide/vue'
const nav = [
    ['Visão geral', '/'],
    ['Despesas', '/despesas'],
    ['Receitas', '/receitas'],
    ['Planejamento', '/planejamento'],
]
</script>
<template>
    <header class="sticky top-0 z-40 border-b border-line bg-[#101012]/85 backdrop-blur-xl">
        <div
            class="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8"
        >
            <RouterLink to="/" class="flex items-center gap-3 text-zinc-100"
                ><span class="grid size-9 place-items-center rounded-xl bg-zinc-100 text-zinc-950"
                    ><WalletCards :size="20" /></span
                ><span
                    ><b class="block text-sm">Finance Tracker</b
                    ><small class="text-xs text-zinc-500">Controle financeiro</small></span
                ></RouterLink
            >
            <nav
                class="flex gap-1 overflow-x-auto rounded-xl border border-line bg-zinc-900/80 p-1"
            >
                <RouterLink
                    v-for="[label, to] in nav"
                    :key="to"
                    :to="to"
                    class="whitespace-nowrap rounded-lg px-3 py-2 text-sm text-zinc-500 transition hover:text-zinc-200"
                    active-class="!bg-zinc-700 !text-white"
                    >{{ label }}</RouterLink
                >
            </nav>
        </div>
    </header>
</template>
