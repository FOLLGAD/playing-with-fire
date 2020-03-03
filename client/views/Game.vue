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
        gameCanvas : this.$refs.gamecanvas,
        socket : ''
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
      this.socket = this.$root.socket;
    },
};
</script>