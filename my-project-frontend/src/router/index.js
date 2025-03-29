import {createRouter, createWebHistory} from "vue-router";
import {unauthorized} from "@/net/index.js";

const router = createRouter( {
    history: createWebHistory(import.meta.env.BASE_URL),
    routes : [
        {
            path: '/',
            name: 'welcome',
            component: () => import("@/views/WelcomeView.vue"),
            children: [
                {
                    path: '',
                    name: 'welcome-login',
                    component: () => import('@/views/welcome/LoginPage.vue')
                },
                {
                    path: 'register',
                    name: 'welcome-register',
                    component: () => import('@/views/welcome/RegisterPage.vue')
                },
                {
                    path: 'reset',
                    name: 'welcome-reset',
                    component: () => import('@/views/welcome/ResetPage.vue')
                }
            ]
        },
        {
            path: '/index',
            name: 'index',
            component: () => import("@/views/IndexView.vue")
        }
    ]
})

/**
 * 路由守卫
 */
router.beforeEach((to, from, next) => {
    const isUnauthorized = unauthorized()
    // 已经登录后拒绝访问登录页面
    if(to.name.startsWith('welcome-') && !isUnauthorized) {
        next('/index')
    } // 未登录时禁止访问登录才能访问的页面
    else if(to.fullPath.startsWith('/index') && isUnauthorized) {
        next('/')
    } else {
        next()
    }
})

export default router