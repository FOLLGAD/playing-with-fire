import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';
import './style.css'

const socket = new WebSocket(`ws://${window.location.host}/api`)

class Socket {
  constructor(socket) {
    this.listeners = {}
    this.socket = socket
    socket.onmessage = (msg) => {
      let { type, data } = JSON.parse(msg)
      if (this.listeners[type]) {
        this.listeners[type](data)
      }
    }
  }
  on(type, fn) {
    this.listeners[type] = fn
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
      socket: new Socket(socket),
    },
  }).$mount('#app');
})();