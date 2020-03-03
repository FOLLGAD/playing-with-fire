<template>
  <div style="text-align: center">
      <span>test</span>
    <div v-for="score in list" :key="score.id">
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
  }
};
</script>