<template>
    <div style="text-align: center">
    <link rel="stylesheet" type="text/css" href="./style.css">
            <div v-for="score in list" :key="score.id">
                <span>
                    {{}}
                </span>
    </div>
</template>

<script>
export default {
  name: 'Login',
  components: {},
  data: () => ({
      list = []
  }),
  methods: {
      login() {
      fetch('/api/highscore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            highscores = this.list
        }),
      })
    },
  },
};
</script>