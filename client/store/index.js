import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

/* eslint-disable no-param-reassign */
export default new Vuex.Store({
  state: {
    isAuthenticated: false,
  },
  mutations: {
    setIsAuthenticated(store, isAuthenticated) {
      store.isAuthenticated = isAuthenticated;
    },
  },
  actions: {
  },
  modules: {
  },
});