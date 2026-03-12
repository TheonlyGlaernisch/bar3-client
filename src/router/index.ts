import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

import Home from '@/views/Home.vue'
import Configuration from '@/views/Configuration.vue'
import MessageCreator from '@/views/MessageCreator.vue'
import Analytics from '@/views/Analytics.vue'
import AccountManager from '@/components/AccountManager.vue'
import About from '@/views/About.vue'
import Help from '@/views/Help.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Home },
  { path: '/config', name: 'Configuration', component: Configuration },
  { path: '/message-creator', name: 'Message Creator', component: MessageCreator },
  { path: '/analytics', name: 'Analytics', component: Analytics },
  { path: '/account', name: 'Account', component: AccountManager },
  { path: '/about', name: 'About', component: About },
  { path: '/help', name: 'Help', component: Help },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

export default router
