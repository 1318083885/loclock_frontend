import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { requiresAuth: false }
    },
    // 公开访问路由（短链接）
    {
        path: '/s/:shortCode',
        name: 'CheckLocation',
        component: () => import('../views/public/Checking.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/denied/:shortCode',
        name: 'AccessDenied',
        component: () => import('../views/public/AccessDenied.vue'),
        meta: { requiresAuth: false }
    },
    // 管理后台路由
    {
        path: '/',
        redirect: '/dashboard',
        component: () => import('../views/Layout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../views/Dashboard.vue'),
                meta: { title: '仪表盘' }
            },
            {
                path: 'links',
                name: 'LinkManage',
                component: () => import('../views/LinkManage.vue'),
                meta: { title: '短链接管理' }
            },
            {
                path: 'admin',
                name: 'AdminManage',
                component: () => import('../views/AdminManage.vue'),
                meta: { title: '管理员管理', requiresSuperAdmin: true }
            },
            {
                path: 'profile',
                name: 'Profile',
                component: () => import('../views/Profile.vue'),
                meta: { title: '个人资料' }
            },
            {
                path: 'ip-blacklist',
                name: 'IpBlacklist',
                component: () => import('../views/IpBlacklist.vue'),
                meta: { title: 'IP黑名单', requiresSuperAdmin: true }
            }
        ]
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// 路由守卫
router.beforeEach(async (to, from, next) => {
    const userStore = useUserStore()

    if (to.meta.requiresAuth) {
        if (!userStore.token) {
            next('/login')
            return
        }

        // 如果还没有用户信息，则获取
        if (!userStore.userInfo) {
            try {
                await userStore.fetchUserInfo()
            } catch (error) {
                next('/login')
                return
            }
        }

        // 检查超级管理员权限
        if (to.meta.requiresSuperAdmin && !userStore.isSuperAdmin()) {
            next('/dashboard')
            return
        }
    }

    next()
})

export default router
