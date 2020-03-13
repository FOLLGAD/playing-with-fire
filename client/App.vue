<template>
  <div id="app">
    <ul class="header-ul">
      <li class="li-extend"><a v-if="!isAuthed" v-on:click="redirect('/login')">Login</a></li>
      <li class="li-extend"><a v-if="!isAuthed" v-on:click="redirect('/signup')">Signup</a></li>
      <li class="li-extend"><a v-if="isAuthed" @click="logoutRedirect">Log out</a></li>
      <li class="li-extend"><a v-on:click="redirect('/highscores')">Highscores</a></li>
      <li class="li-extend"><a v-if="isAuthed" v-on:click="redirect('/gamerooms')">Game rooms</a></li>
    </ul>
      <router-view></router-view>
  </div>
</template>

<script>
import { mapState, mapActions } from "vuex";
export default {
  computed: {
    ...mapState({
      isAuthed: state => state.isAuthenticated
    }),
    ...mapActions({
      logout: "logout"
    })
  },
  methods: {
    redirect(target) {
      this.$router.push(target).catch(err => {});
    },
    logoutRedirect() {
      this.$store.dispatch("logout").finally(() => {
        this.redirect("/login");
      });
    }
  }
};
</script>