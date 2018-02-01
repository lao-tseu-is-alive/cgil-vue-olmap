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
                h1, h2 {
                    padding: 0.1rem 1rem;
                }
            }
        }
    }

    .my-map {
        position: relative;
        box-sizing: border-box;
        width: 100%;
        height: 750px;
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
                    :geomWkt="initialGeom"
            ></cgil-ol-map>
        </div>
        <el-input
                title="initial geometry"
                type="textarea"
                :rows="4"
                placeholder="Initial geometry"
                v-model="initialGeom">
        </el-input>
        <el-input
                title="saved geometry"
                type="textarea"
                :rows="4"
                placeholder="saved geometry"
                v-model="savedGeom">
        </el-input>

    </div>
</template>

<script>
  import cgilOlMap from './cgil-vue-olmap'

  const pos = [538350.5, 152669.0] // cathedrale Lausanne
  export default {
    components: {
      cgilOlMap
    },
    data() {
      return {
        title: 'Testing cgil-vue-olmap',
        center: pos,
        initialGeom:
          `MULTIPOLYGON(
          ((538319.52 152664.64,538318.72 152659.83,538343.55 152656.63,538344.15 152661.63,538319.52 152664.64)),
          ((538352.76 152659.83,538351.16 152645.21,538361.57 152644.41,538362.78 152651.02,538372.19 152650.02,538374.19 152657.03,538352.76 152659.83))
                   )`,
        savedGeom: null
      }
    }
  }
</script>