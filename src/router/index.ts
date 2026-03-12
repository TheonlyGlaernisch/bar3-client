import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

import AccountManager from '../components/AccountManager.vue'
import About from '../views/About.vue'
import Help from '../views/Help.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  {
    path: '/',
    name: 'Account',
    component: AccountManager
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/help',
    name: 'Help',
    component: Help
  },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
