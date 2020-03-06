import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './style.css'

// Simple wrapper around the native WebSocket
class Socket {
  constructor() {
    this.listeners = {}
    this.connect()
  }
  connect() {
    let socket = new WebSocket(`ws://${window.location.host}/api`)
    this.socket = new Promise(r => socket.onopen = () => r(socket))
    this.socket.then(s => s.onmessage = (msg) => {
      let { type, data } = JSON.parse(msg.data)
      if (this.listeners[type]) {
        this.listeners[type](data)
      }
    })
  }
  on(type, fn) {
    this.listeners[type] = fn
  }
  send(type, data) {
    return this.socket.then(s => s.send(JSON.stringify({ type, data })))
  }
}

Vue.config.productionTip = false;

(async () => {
  // Find out if the user is already logged in
  const isAuthenticated = await fetch('/api/is-authenticated')
    .then(resp => resp.ok ? true : false)
    .catch(() => false);

  store.commit('setIsAuthenticated', isAuthenticated);

  new Vue({
    router,
    store,
    render: h => h(App),
    data: {
      socket: new Socket(),
    },
  }).$mount('#app');
})();