<template>
   <div>
       <canvas ref="gamecanvas"></canvas>
  </div>
</template>

<script>
import gameCanvas from '../canvas.js';
export default {
    name: 'Booking',
    components: {},
    data: () => ({
<<<<<<< HEAD
        players: 0,
=======
        gameCanvas : this.$refs.gamecanvas,
        socket : ''
>>>>>>> 3646ce1778f3153afb4a3b0e435bd041f4252849
  }),
    methods: {
  },
    mounted() { 
        this.socket.on('update', (gamelogic) => {
        // make game-canvas takes in the game logic using gamelogic

        this.gameCanvas.updateObjects(gamelogic)
      });
      this.socket.on('remove', (gamelogic) => {
        // make game-canvas takes in the game logic using gamelogic
        this.gameCanvas.remove(gamelogic)
      });
    },
    created(){
      let r = this.$refs.gamecanvas
      this.socket = this.$root.socket;
      fetch('/api/game')
        .then(res => res.json())
        .then((data) => {
            this.gameCanvas.init(r, data.gameScene)
        })
        .catch(console.error);
    },
};
</script>