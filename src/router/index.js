import { createRouter, createWebHistory } from 'vue-router'

const routes = [
    {
        path: '/',
        // 访问根目录时，自动跳转到登录页
        redirect: '/login'
    },
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue')
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
    },
    {
        // 天道碑（排行榜）。契约见 LWG docs/requirement-ranking.md 第 4 节
        path: '/rank',
        name: 'RankBoard',
        component: () => import('../views/RankBoard.vue')
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
    const userId = localStorage.getItem('lwg_user_id')

    if (to.path !== '/login' && !userId) {
        next('/login') // 没登录，踢回登录页
    } else {
        next() // 放行
    }
})

export default router
