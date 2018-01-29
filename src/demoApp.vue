<style lang="scss">
html {
    body {
        margin: 0;
        padding: 0; 
        width: 100%;
        height: 100%; 
        div {
           
            
            margin: 0;
            padding: 0;  
            h1,h2 {
                padding: 0.1rem 1rem;
            }
        }      
    }
    
}
.my-map {  
    position: relative; 
    box-sizing: border-box;
    width: 100%;
    height: 900px;
    padding: 0px;
    border: 1px solid black;
}
</style>

<template>
  <div>
   
    <div class="my-map">
    <cgil-ol-map
            :edit-geom-enabled="true"
            :center="center"
            :zoom="8"
    ></cgil-ol-map>
    </div>
  </div>
</template>

<script>
import cgilOlMap from './cgil-vue-olmap'
const pos = [538350.5 , 152669.0] // cathedrale Lausanne
export default {
    components: {
        cgilOlMap
    },
  data() {
    return {
      title: 'Testing cgil-vue-olmap',
      center: pos
    }
  }
}
</script>