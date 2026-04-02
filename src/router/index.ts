import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'

import Home from '@/views/Home.vue'
import Configuration from '@/views/Configuration.vue'
import MessageCreator from '@/views/MessageCreator.vue'
import Analytics from '@/views/Analytics.vue'
import AccountManager from '@/components/AccountManager.vue'
import About from '@/views/About.vue'
import Help from '@/views/Help.vue'
import DiscordLogin from '@/views/DiscordLogin.vue'
import DiscordCallback from '@/views/DiscordCallback.vue'
import { discordAuth } from '@/utilities/discordAuth'

Vue.use(VueRouter)

const DISCORD_PUBLIC_PATHS = ['/discord-login', '/auth/discord/callback'];

const routes: Array<RouteConfig> = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: Home },
  { path: '/config', name: 'Configuration', component: Configuration },
  { path: '/message-creator', name: 'Message Creator', component: MessageCreator },
  { path: '/analytics', name: 'Analytics', component: Analytics },
  { path: '/account', name: 'Account', component: AccountManager },
  { path: '/about', name: 'About', component: About },
  { path: '/help', name: 'Help', component: Help },
  { path: '/discord-login', name: 'Discord Login', component: DiscordLogin },
  { path: '/auth/discord/callback', name: 'Discord Callback', component: DiscordCallback },
]

const router = new VueRouter({
  mode: 'history',
  routes
})

router.beforeEach(async (to, _from, next) => {
  if (DISCORD_PUBLIC_PATHS.includes(to.path)) {
    next();
    return;
  }

  const authed = await discordAuth.isAuthed();
  if (!authed) {
    next('/discord-login');
  } else {
    next();
  }
});

export default router
