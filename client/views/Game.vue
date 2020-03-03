<template>
  <div>
    <canvas ref="gamecanvas"></canvas>
  </div>
</template>

<script>
import { init, removeObjects, updateObjects } from "../canvas.js";
export default {
  name: "Game",
  components: {},
  data: () => ({
    gameCanvas: null,
    socket: null
  }),
  methods: {},
  mounted() {
    let r = this.$refs.gamecanvas;
    this.gameCanvas = r;
    this.socket = this.$root.socket;

    this.socket.on("update", gamelogic => {
      // make game-canvas takes in the game logic using gamelogic

      updateObjects(gamelogic);
    });
    this.socket.on("remove", gamelogic => {
      // make game-canvas takes in the game logic using gamelogic
      remove(gamelogic);
    });

    this.socket.on("new-game", data => {
      console.log("new game data", data);
      init(r, data.entities);
    });
  },
  created() {}
};
</script>