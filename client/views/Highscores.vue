<template>
  <div style="text-align: center">
    <h3>Highscores:</h3>
      <div v-for="(score, index) in list" :key="score.id">
        <h4>
          <span>{{index + 1}}.{{ "" + score.username + " Wins:" + score.count}}</span>
        </h4>
      </div>
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