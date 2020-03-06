<template>
  <div>
    <canvas ref="gamecanvas"></canvas>
  </div>
</template>

<script>
import { init, destroy } from "../canvas.js";
export default {
  name: "Game",
  components: {},
  data: () => ({
    gameCanvas: null,
    socket: null
  }),
  async mounted() {
    this.gameCanvas = this.$refs.gamecanvas;
    this.socket = await this.$root.socket;

    this.socket.send("join-game", this.$route.params.gameid)

    this.socket.on("joined-game", data => {
      init(this.socket, this.gameCanvas, data.entities);
    });
  },
  beforeDestroy() {
    if (this.socket) this.socket.send('leave-game')
    destroy()
  }
};
</script>