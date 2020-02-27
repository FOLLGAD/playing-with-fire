import Vue from 'vue';
import App from './App.vue';
import router from './router';
import store from './store';

const socket = new WebSocket(`ws://${window.location.host}/api`)

Vue.config.productionTip = false;

(async () => {
  // Find out if the user is already logged in
  const { isAuthenticated } = await fetch('/api/is-authenticated')
    .then(resp => resp.json())
    .catch(console.error);

  store.commit('setIsAuthenticated', isAuthenticated);

  new Vue({
    router,
    store,
    render: h => h(App),
    data: {
      socket,
    },
  }).$mount('#app');
})();