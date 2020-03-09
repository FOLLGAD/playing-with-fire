<template>
<div class="game">
  <div class="game-sidebar">
    <h1>Sidebar</h1>
    <div class="sidebar-players">
      <div class="player" v-for="player in players">
        {{player.username}}
      </div>
    </div>
  </div>
  <div>
    <canvas ref="gamecanvas"></canvas>
  </div>
</div>
</template>

<script>
import { init, destroy } from "../canvas.js";
export default {
  name: "Game",
  components: {},
  data: () => ({
    gameCanvas: null,
    socket: null,
    players: [],
  }),
  async mounted() {
    this.gameCanvas = this.$refs.gamecanvas;
    this.socket = await this.$root.socket;

    this.socket.on("joined-game", data => {
      this.players = data.players
      init(this.socket, this.gameCanvas, data.entities);
    });
    this.socket.on("not-found", () => {
      this.$router.push(`/gamerooms`);
    });

    this.socket.send("join-game", this.$route.params.gameid)
  },
  beforeDestroy() {
    if (this.socket) this.socket.send('leave-game')
    destroy()
  }
};
</script>

<style>
.game {
  display: flex;
  justify-content: center;
}

.game-sidebar {
  width: 300px;
}
</style>
