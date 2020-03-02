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
        players: 0,
  }),
    methods: {
  },
    mounted() { 
        let r = this.$refs.gamecanvas
        gameCanvas(r)
    },
    created(){
        
    },
};
</script>