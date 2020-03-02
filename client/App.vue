<template>
  <div id="app">
    <div style="text-align: center">
      <h1>Welcome!</h1>
      <div v-if="!isAuthed" v-on:click="redirect('/login')">Login</div>
      <div v-if="!isAuthed" v-on:click="redirect('/signup')">Signup</div>
      <div v-if="isAuthed" @click="logoutRedirect">Log out</div>
      <div v-on:click="redirect('/highscores')">Highscores</div>
      <div v-if="isAuthed" v-on:click="redirect('/gamerooms')">Game rooms</div>
      <router-view></router-view>
    </div>
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