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
          font-size: 1.1rem;
        }
      }
    }
  }

  .my-map {
    position: relative;
    box-sizing: border-box;
    width: 100%;
    height: 750px;
    padding: 0;
    border: 1px solid black;
  }

  .github-corner:hover .octo-arm {
    animation: octocat-wave 560ms ease-in-out
  }

  @keyframes octocat-wave {
    0%, 100% {
      transform: rotate(0)
    }
    20%, 60% {
      transform: rotate(-25deg)
    }
    40%, 80% {
      transform: rotate(10deg)
    }
  }

  @media (max-width: 500px) {
    .github-corner:hover .octo-arm {
      animation: none
    }
    .github-corner .octo-arm {
      animation: octocat-wave 560ms ease-in-out
    }
  }
</style>

<template>
  <div>
    <h1>Page de test du composant <a href="https://www.npmjs.com/package/cgil-vue-olmap">cgil-vue-olmap</a></h1>
    <a href="https://github.com/lao-tseu-is-alive/cgil-vue-olmap"
       class="github-corner" aria-label="View source on Github" title="View source on Github">
      <svg width="80" height="80" viewBox="0 0 250 250"
           style="fill:#64CEAA; color:#fff; position: absolute; top: 0; border: 0; right: 0;" aria-hidden="true">
        <path d="M0,0 L115,115 L130,115 L142,142 L250,250 L250,0 Z"></path>
        <path
          d="M128.3,109.0 C113.8,99.7 119.0,89.6 119.0,89.6 C122.0,82.7 120.5,78.6 120.5,78.6 C119.2,72.0 123.4,76.3 123.4,76.3 C127.3,80.9 125.5,87.3 125.5,87.3 C122.9,97.6 130.6,101.9 134.4,103.2"
          fill="currentColor" style="transform-origin: 130px 106px;" class="octo-arm"></path>
        <path
          d="M115.0,115.0 C114.9,115.1 118.7,116.5 119.8,115.4 L133.7,101.6 C136.9,99.2 139.9,98.4 142.2,98.6 C133.8,88.0 127.5,74.4 143.8,58.0 C148.5,53.4 154.0,51.2 159.7,51.0 C160.3,49.4 163.2,43.6 171.4,40.1 C171.4,40.1 176.1,42.5 178.8,56.2 C183.1,58.6 187.2,61.8 190.9,65.4 C194.5,69.0 197.7,73.2 200.1,77.6 C213.8,80.2 216.3,84.9 216.3,84.9 C212.7,93.1 206.9,96.0 205.4,96.6 C205.1,102.4 203.0,107.8 198.3,112.5 C181.9,128.9 168.3,122.5 157.7,114.1 C157.9,116.9 156.7,120.9 152.7,124.9 L141.0,136.5 C139.8,137.7 141.6,141.9 141.8,141.8 Z"
          fill="currentColor" class="octo-body"></path>
      </svg>
    </a>
    <div class="my-map" v-show="isMapVisible">
      <cgil-ol-map ref="mymap"
                   :edit-geom-enabled="isEditEnable"
                   :use-internal-wmts="true"
                   :center="center"
                   :zoom="8"
                   :geomWkt="initialGeom"
                   baselayer="fonds_geo_osm_bdcad_gris"
                   :geojsondata="geojson"
                   @gomapSaveGeomClick="saveGeometry"
                   @mapclick="handleMapCLick"
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
    <el-button @click="isMapVisible=!isMapVisible">{{!isMapVisible ? 'Afficher': 'Cacher'}} la carte</el-button>
    <el-button @click="isEditEnable=!isEditEnable">{{!isEditEnable ? 'Activer': 'Désactiver'}} l'édition</el-button>
  </div>
</template>

<script>
import cgilOlMap from './cgil-vue-olmap'
import Log from 'cgil-log'
import {DEV} from './config'
import { geodata } from './data'
import {Conv21781To2056} from './OpenLayersSwiss21781'

const MODULE_NAME = 'DemoVueOlMap';
const log = (DEV) ? new Log(MODULE_NAME, 4) : new Log(MODULE_NAME, 1);

const pos = [538350.5, 152669.0] // cathedrale Lausanne
export default {
  name: 'demoApp',
  components: {
    cgilOlMap
  },
  data () {
    return {
      title: 'Testing cgil-vue-olmap',
      isMapVisible: false,
      isEditEnable: true,
      center: pos,
      geojson: geodata,
      // second polygon is invalid and should not be imported
      initialGeom: `MULTIPOLYGON(
          ((538319.23456 152664.64,538318.72 152659.83,538343.55 152656.63,538344.15 152661.63,538319.52 152664.64)),
          ((538330.93 152670.02,538328.23 152653.9,538359.97 152651.1,538319.21 152664.12,538330.93 152670.02)),
          ((538352.76 152659.83,538351.16 152645.21,538361.57 152644.41,538362.78 152651.02,538372.19 152650.02,538374.19 152657.03,538352.76 152659.83))
                   )`,
      savedGeom: null
    }
  },
  watch: {
    'isMapVisible' (val) {
      if (val === true) {
        this.$refs.mymap.updateScreen()
      }
    }
  },
  mounted () {
    log.t('In demoApp cgil-vue-olmap mounted: ')
    this.testConversionToMn95()
  },
  methods: {
    saveGeometry: function (val) {
      log.t('In demoApp cgil-vue-olmap event gomapSaveGeomClick received : ', val)
      this.savedGeom = val
    },
    testConversionToMn95() {
      const PFP1_MN03 = [537681.26 , 150797.21]
      const PFP1_MN95 = [2537680.826 , 1150797.6]
      const testMN95 = Conv21781To2056(PFP1_MN03[0], PFP1_MN03[1])
      log.l(`Point in REAL MN95  is ${PFP1_MN95[0]} / ${PFP1_MN95[1]}`)
      log.l(`Proj4Js conversion  is ${testMN95.x} / ${testMN95.y}`)

    },
    handleMapCLick(info) {
      log.t('#### In handleMapCLick cgil-vue-olmap event mapclick received : ', info)
    }
  }
}
</script>
