import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Tools from '@/views/Tools.vue'
import Settings from '@/views/Settings.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Home',
      component: Home
    },
    {
      path: '/tools',
      name: 'Tools',
      component: Tools
    },
    {
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router