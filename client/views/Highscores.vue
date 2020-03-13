<template>
<div align="center">
  <h1>Highscores</h1>
  <ul class="highscore-ul">
      <li class ="li b" v-for="(score, index) in list" :key="score.id"><b>
          {{index + 1}}.{{ "" + score.username + " Wins:" + score.count}}</b>
      </li>
  </ul>
</div>
</template>

<script>
export default {
  name: "Highscores",
  components: {},
  data: () => ({
    list: []
  }),
  methods: {
  },
  created() {
    fetch('/api/highscores')
      .then(res => res.json())
      .then((data) => {
        this.list = data.list;
      })
      .catch(console.error);
  },
};
</script>