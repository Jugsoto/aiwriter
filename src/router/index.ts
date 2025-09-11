import { createRouter, createWebHashHistory } from 'vue-router'
import Home from '@/views/Home.vue'
import Tools from '@/views/Tools.vue'
import Settings from '@/views/Settings.vue'
import BookView from '@/views/BookView.vue'

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
      path: '/settings',
      name: 'Settings',
      component: Settings
    }
  ]
})

export default router
