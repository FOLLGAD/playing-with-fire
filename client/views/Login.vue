<template>
    <div style="text-align: center">
    <link rel="stylesheet" type="text/css" href="./style.css">
        <div class ="login-page">
            <form class ="form" v-on:submit.prevent="login()">
            <h1 class="h1">Login</h1>
            <input class = "h1" type="text" v-model="name" placeholder="username" required autofocus /><br>
            <input class = "h1" type="text" v-model="password" placeholder="password" required autofocus /><br>
            <input type="submit" value="Submit" /><br>
            </form><br>
        </div>
    </div>
</template>

<script>
export default {
  name: 'Login',
  components: {},
  data: () => ({
      name: '',
      password: ''
  }),
  methods: {
      login() {
      fetch('/api/authenticate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.name,
          password: this.password,
        }),
      }).then((resp) => {
          if (resp.ok) return resp;
          this.$store.commit('setIsAuthenticated', false);
          this.failed = true;
          this.$router.push({
            path: 'login',
          });
          throw new Error(resp.text);
        })
        .then(() => {
          this.$store.commit('setIsAuthenticated', true);
          this.$router.push(`/list/${this.name}`);
        })
        .catch((error) => {
          console.error('Authentication failed unexpectedly');
          throw error;
        });
    },
  },
};
</script>