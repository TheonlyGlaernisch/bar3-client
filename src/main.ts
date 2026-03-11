import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

const GA_MEASUREMENT_ID = 'G-P4D00LBHYL'

(function() {
  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`
  document.head.appendChild(script)

  window.dataLayer = window.dataLayer || []
  function gtag(){window.dataLayer.push(arguments)}
  window.gtag = gtag
  gtag('js', new Date())
  gtag('config', GA_MEASUREMENT_ID)
})()

// Track route changes if using Vue Router
router.afterEach((to) => {
  if (window.gtag) {
    window.gtag('config', GA_MEASUREMENT_ID, { page_path: to.fullPath })
  }
})
// ------------------------

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
