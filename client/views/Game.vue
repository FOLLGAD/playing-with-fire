<template>
<div class="game">
  <div class="game-sidebar">
    <h2>Players</h2>
    <div class="sidebar-players">
      <div class="player" v-for="player in players">
        {{player.username}}
      </div>
    </div>
  </div><br>
  <div v-if="!startGame">
      <button v-if="isHost" @click="start">Start Game</button>
      <div v-else>Host will start game when players are ready.</div><br>
  </div>
  <div v-show="startGame" class="game-div">
      <h1 v-if="winner" class="winner-text">{{this.winner + " is the winner!"}}</h1>
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
    startGame: false,
    isHost: false,
    gamedata: null,
    winner: null,
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
      let { isHost, players } = data
      this.players = players
      this.isHost = isHost
    });
    this.socket.on("winner", data => {
      this.winner = data
    });
    this.socket.on("player-joined", newPlayers => {
      newPlayers.forEach(p => {
        let found = this.players.find(tp => tp.username === p.username)
        if (found) {
          Object.assign(found, p)
        } else {
          this.players.push(p)
        }
      })
    });
    this.socket.on("new-host", () => {
      this.isHost = true;
    })
    this.socket.on("player-leave", playersUsernames => {
      this.players = this.players.filter(p => playersUsernames.indexOf(p.username) === -1)
    });
    this.socket.on("not-found", () => {
      this.$router.push(`/gamerooms`);
    });
    this.socket.on("game-start", data => {
      this.startGame = true
      this.winner = null
      this.gamedata = data
      init(this.socket, this.$refs.gamecanvas, this.gamedata.entities);
    });
    this.socket.on("game-stop", data => {
      this.startGame = false
      this.gamedata = null

      destroy(); // Stop the game
    });

    this.socket.send("join-game", this.$route.params.gameid)
  },
  beforeDestroy() {
    if (this.socket) this.socket.send('leave-game')
    destroy()
  },
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

.winner-text {
  position: absolute;
  display: block;
  width: 100%;
  text-align: center;
  color: white;
  text-shadow: 0 0 6px black;
  top: 35%;
}

.game-div {
  position: relative;
}
</style>
