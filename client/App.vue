<template>
   <div id="app">
      <div style="text-align: center">
        <h1>Welcome!</h1>
            <div v-on:click="redirect('/login')">
                Login
            </div>
            <div v-on:click="redirect('/highscores')">
                Heighscores
            </div>
        <router-view></router-view>
    </div>
  </div>
</template>

<script>
export default {
  methods: {
    redirect(target) {
      this.$router.push(target);
    },
  },
};
</script>