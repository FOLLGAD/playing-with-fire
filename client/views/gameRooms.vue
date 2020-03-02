<template>
   <div class="row">
        <div v-for="game in games" :key="game.id">
          <div style="text-align: center;">
            <h4>
               <span>{{game.players}}</span>
              <button @click="redirect(game.id)">Enter game</button>
            </h4>
          </div>
        </div>
      </div>

</template>

<script>
import gameCanvas from '../canvas.js';
export default {
    name: 'Booking',
    components: {},
    data: () => ({
        games : [],
        socket : ''
  }),
    methods: {
        redirect(gameid){
            this.$router.push(`/game/${gameid}`);
        }
  },
    mounted(){
      this.socket.on('gameRoomUpdate', (gameRooms) => {
      this.games = gameRooms;
    });
    },
    created(){
        this.socket = this.$root.socket;
        fetch('/api/gameRooms')
        .then(res => res.json())
        .then((data) => {
            this.games = data.list;
        })
        .catch(console.error);
    },
};
</script>