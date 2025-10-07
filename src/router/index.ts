import { createRouter, createWebHashHistory } from 'vue-router'
// 使用动态导入实现路由级别的代码分割
const Home = () => import('@/views/Home.vue')
const Tools = () => import('@/views/Tools.vue')
const Settings = () => import('@/views/Settings.vue')
const BookView = () => import('@/views/BookView.vue')
const Prompts = () => import('@/views/Prompts.vue')
const Announcements = () => import('@/views/Announcements.vue')

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/book/:id',
      name: 'BookView',
      component: BookView,
      props: true
    },
    {
      path: '/tools',
      name: 'Tools',
      component: Tools
    },
        {
      path: '/prompts',
      name: 'Prompts',
      component: Prompts
    },
    {
      path: '/announcements',
      name: 'Announcements',
      component: Announcements
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router
