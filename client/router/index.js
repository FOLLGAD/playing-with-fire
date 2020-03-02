import Vue from 'vue';
import VueRouter from 'vue-router';
import LoginView from '../views/Login.vue';
import HighscoresView from '../views/Highscores.vue';
import GameView from '../views/Game.vue';
import gameRoomsView from '../views/gameRooms.vue';
import SignupView from '../views/Signup.vue';
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
    { path: '/game/:gameid', component: GameView, beforeEnter: authGuard },
    { path: '/highscores', component: HighscoresView },
    { path: '/login', component: LoginView },
    { path: '/signup', component: SignupView },
    { path: '/gamerooms', component: gameRoomsView },
    { path: '/', component: Error404 },
  ];

  const router = new VueRouter({
    mode: 'history',
    routes,
  });
  
  export default router;