import Vue from 'vue';
import VueRouter from 'vue-router';
import LoginView from '../views/Login.vue';
import HighscoresView from '../views/Highscores.vue';
import GameView from '../views/Game.vue';
import Error404 from '../views/404.vue';
import store from '../store'

Vue.use(VueRouter);

const authGuard = (to, from, next) => {
  if (!store.state.isAuthenticated) {
    return next("/login")
  }
  next();
}

const routes = [
    { path: '/game', component: GameView, beforeEnter: authGuard },
    { path: '/highscores', component: HighscoresView },
    { path: '/login', component: LoginView },
    { path: '/', component: Error404 },
  ];

  const router = new VueRouter({
    mode: 'history',
    routes,
  });
<<<<<<< HEAD

  // Setup Authentication guard
router.beforeEach((to, from, next) => {
    if (((!store.state.isAuthenticated) || !(to.path === '/highscores'))) {
      console.info('Unauthenticated user. Redirecting to login page.');
      next('/login');
    } else {
      next();
    }
  });
=======
>>>>>>> b5cc7379e1c174d25abcfc389461dc6838e0d06b
  
  export default router;