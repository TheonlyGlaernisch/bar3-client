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

router.beforeEach((to, _from, next) => {
  // Discord redirects to the site root with ?code=... when using root as
  // redirect_uri. Forward those requests into the callback route so the
  // existing DiscordCallback component handles the exchange exactly once.
  if (to.query.code && to.path !== '/auth/discord/callback') {
    const oauthQuery: Record<string, string> = { code: to.query.code as string };
    if (to.query.state) {
      oauthQuery.state = to.query.state as string;
    }
    next({ path: '/auth/discord/callback', query: oauthQuery });
    return;
  }

  const isDiscordAuthed = !!localStorage.getItem('discordSessionToken');
  if (!isDiscordAuthed && !DISCORD_PUBLIC_PATHS.includes(to.path)) {
    next('/discord-login');
  } else {
    next();
  }
});

export default router
