import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify';

Vue.config.productionTip = false

// Google Analytics
const script = document.createElement('script')
script.async = true
script.src = "https://www.googletagmanager.com/gtag/js?id=G-P4D00LBHYL"
document.head.appendChild(script)

window.dataLayer = window.dataLayer || []
function gtag(){dataLayer.push(arguments)}
gtag('js', new Date())
gtag('config', 'G-P4D00LBHYL')

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
