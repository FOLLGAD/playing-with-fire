<template>
   <div>
       <gameCanvas></gameCanvas>
  </div>
</template>

<script>
import gameCanvas from '../canvas.js';
export default {
    name: 'Booking',
    components: {},
    data: () => ({
  }),
    methods: {
    redirect(target) {
      this.$router.push(target);
    },
  },
    mounted() { 
    
    },
};
</script>