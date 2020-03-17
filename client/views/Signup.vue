<template>
    <div style="text-align: center">
        <div class ="login-page">
            <form class ="form" v-on:submit.prevent="login()">
            <div style="color:white;">Signup</div><br>
            <input class = "h1" type="text" v-model="name" placeholder="username" required autofocus /><br>
            <input class = "h1" type="password" v-model="password" placeholder="password" required autofocus /><br>
            <input type="submit" value="Submit" /><br>
            <p v-if="this.failed">{{this.error}}</p>
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
      password: '',
      failed: false,
      error: ''
  }),
  methods: {
      login() {
      fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.name,
          password: this.password,
        }),
      })
        .then((resp) => {
        console.log(resp);
        if (resp.ok){
            this.$router.push('/login');
        }else{
            this.failed = true
            resp.json().then(data => {
               this.error = data.error
            });
        }
        })
        .catch((error) => {
          console.error(error);
          throw error;
        });
    },
  },
};
</script>