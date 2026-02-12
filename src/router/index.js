import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        // 访问根目录时，自动跳转到任务大厅
        redirect: '/mission-hall'
    },
    {
        path: '/mission-hall',
        name: 'MissionHall',
        // 懒加载：访问时才加载这个文件，速度快
        component: () => import('../views/MissionHall.vue')
    },
    {
        path: '/dashboard',
        name: 'UserDashboard',
        component: () => import('../views/UserDashboard.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router