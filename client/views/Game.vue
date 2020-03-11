<template>
<div class="game">
  <div class="game-sidebar">
    <h1>Sidebar</h1>
    <div class="sidebar-players">
      <div class="player" v-for="player in players">
        {{player.username}}
      </div>
    </div>
  </div><br>
  <div v-if="!startGame">
      <div>Host will start game when players are ready.</div><br>
      <button @click="start">Start Game</button>
  </div>
    <div v-if="startGame">
      <div>
        <canvas ref="gamecanvas"></canvas>
      </div>
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
    startGame: false
  }),
  methods: {
    start() {
      this.$root.socket.send("start-game");
    }
  },
  async mounted() {
    this.gameCanvas = this.$refs.gamecanvas;
    this.socket = await this.$root.socket;

    this.socket.on("joined-game", data => {
      this.players = data.players
    });
    this.socket.on("not-found", () => {
      this.$router.push(`/gamerooms`);
    });
    this.socket.on("open-canvas", ({isHost}) => {
      if(isHost){
        this.startGame = true
        init(this.socket, this.gameCanvas, data.entities);
      }  
    });


    this.socket.send("join-game", this.$route.params.gameid)
  },
  beforeDestroy() {
    if (this.socket) this.socket.send('leave-game')
    destroy()
  },
  created() {
    fetch("/api/game")
      .then(res => res.json())
      .then(data => {
        this.host = data.host;
      })
      .catch(console.error);
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
