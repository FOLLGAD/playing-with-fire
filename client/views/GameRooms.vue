<template>
  <div class="row">
    <div v-for="game in games" :key="game.id">
      <div style="text-align: center;">
        <h4>
          <span>{{game.id}} {{game.players}}</span>
          <button @click="enterGame(game.id)">Enter game</button>
        </h4>
      </div>
    </div>
    <button @click="createGame">Create Game</button>
  </div>
</template>

<script>
import gameCanvas from "../canvas.js";
export default {
  name: "Booking",
  components: {},
  data: () => ({
    games: [],
    socket: ""
  }),
  methods: {
    redirect(gameid) {
      this.$router.push(`/game/${gameid}`);
    },
    createGame() {
      this.$root.socket.send("create-game");
    },
    enterGame(gameId) {
      this.$root.socket.send("join-game", gameId);
      this.redirect(gameId);
    }
  },
  mounted() {
    this.$root.socket.on("update-gamelist", gameRooms => {
      console.log("Updating", gameRooms)
      gameRooms.forEach(g_new => {
        let g_old = this.games.find(g => g.id === g_new.id)
        if (g_old) {
          Object.assign(g_old, g_new)
        } else {
          this.games.push(g_new)
        }
      })
    });
  },
  created() {
    this.$root.connectSocket();
    fetch("/api/games")
      .then(res => res.json())
      .then(data => {
        console.log(data);
        this.games = data.list;
      })
      .catch(console.error);
  }
};
</script>