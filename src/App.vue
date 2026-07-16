<script setup lang="ts">
import { onMounted } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { useFinanceStore } from '@/stores/finance-store'
const store = useFinanceStore()
onMounted(() => store.initialize())
</script>

<template>
    <div class="min-h-screen">
        <AppHeader />
        <main class="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div
                v-if="store.error"
                class="mb-6 rounded-xl border border-red-900 bg-red-950/50 p-4 text-sm text-red-300"
            >
                {{ store.error }}
            </div>
            <RouterView />
        </main>
    </div>
</template>
