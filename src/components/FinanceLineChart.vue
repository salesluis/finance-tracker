<script setup lang="ts">
import { VisAxis, VisLine, VisXYContainer } from '@unovis/vue'
import { monthNames } from '@/lib/format'
defineProps<{ data: { month: number; income: number; expense: number }[] }>()
const x = (d: { month: number }) => d.month
const income = (d: { income: number }) => d.income
const expense = (d: { expense: number }) => d.expense
</script>
<template>
    <div class="h-72">
        <VisXYContainer
            :data="data"
            :margin="{ left: 10, right: 10, top: 20, bottom: 10 }"
            height="100%"
        >
            <VisLine
                :x="x"
                :y="[income, expense]"
                :color="['#34d399', '#fb7185']"
                :line-width="3"
            />
            <VisAxis
                type="x"
                :tick-format="(v: number) => monthNames[v].slice(0, 3)"
                :grid-line="false"
            /><VisAxis type="y" :tick-format="(v: number) => `${Math.round(v / 1000)}k`" />
        </VisXYContainer>
    </div>
</template>
