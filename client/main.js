import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './style.css'

// Simple wrapper around the native WebSocket
class Socket {
  constructor() {
    this.listeners = {}
  }
  setSocket(socket) {
    this.socket = socket
    this.socket.onmessage = (msg) => {
      let { type, data } = JSON.parse(msg.data)
      if (this.listeners[type]) {
        this.listeners[type](data)
      }
    }
  }
  on(type, fn) {
    this.listeners[type] = fn
  }
  send(type, data) {
    return this.socket.send(JSON.stringify({ type, data }))
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
    methods: {
      connectSocket() {
        let socket = new WebSocket(`ws://${window.location.host}/api`)
        this.socket.setSocket(socket)
      }
    },
    data: {
      socket: new Socket(),
    },
  }).$mount('#app');
})();