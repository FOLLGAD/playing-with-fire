import Vue from 'vue';
import VueRouter from 'vue-router';
import LoginView from '../views/Login.vue';
import HighscoresView from '../views/Highscores.vue';
import GameView from '../views/Game.vue';

Vue.use(VueRouter);

const routes = [
    { path: '/game', component: GameView },
    { path: '/highscores', component: HighscoresView },
    { path: '/login', component: LoginView },
  ];

  const router = new VueRouter({
    mode: 'history',
    routes,
  });

  // Setup Authentication guard
router.beforeEach((to, from, next) => {
    if (((!store.state.isAuthenticated) && !(to.path === '/highscores'))) {
      console.info('Unauthenticated user. Redirecting to login page.');
      next('/login');
    } else {
      next();
    }
  });
  
  export default router;