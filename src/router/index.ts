import { createRouter, createWebHistory } from 'vue-router'
import DashboardPage from '@/pages/DashboardPage.vue'
const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: DashboardPage },
        {
            path: '/despesas',
            component: () => import('@/pages/EntriesPage.vue'),
            props: { type: 'expense' },
        },
        {
            path: '/despesas/:id',
            component: () => import('@/pages/EntryDetailPage.vue'),
            props: { type: 'expense' },
        },
        {
            path: '/receitas',
            component: () => import('@/pages/EntriesPage.vue'),
            props: { type: 'income' },
        },
        {
            path: '/receitas/:id',
            component: () => import('@/pages/EntryDetailPage.vue'),
            props: { type: 'income' },
        },
        { path: '/planejamento', component: () => import('@/pages/PlanningPage.vue') },
        { path: '/:pathMatch(.*)*', component: () => import('@/pages/NotFoundPage.vue') },
    ],
})
export default router
