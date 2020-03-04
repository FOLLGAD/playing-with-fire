<template>
  <div>
    <canvas ref="gamecanvas"></canvas>
  </div>
</template>

<script>
import { init } from "../canvas.js";
export default {
  name: "Game",
  components: {},
  data: () => ({
    gameCanvas: null,
    socket: null
  }),
  mounted() {
    this.gameCanvas = this.$refs.gamecanvas;
    this.socket = this.$root.socket;

    this.socket.on("new-game", data => {
      console.log(data)
      console.log("New game made")
      init(this.socket, this.gameCanvas, data.entities);
    });

    this.socket.send('game-info')
  },
};
</script>