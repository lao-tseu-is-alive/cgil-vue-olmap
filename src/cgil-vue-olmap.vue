<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">

  @import "./ol.css";

  $toolbar_height: 2.0em;
  $button_size: 1.5em;

  .main {
    width: 100%;
    height: 97%;
    margin: 0px;
    padding: 0px;
    overflow: hidden;
  }

  .map-toolbar{
    height: $toolbar_height;
    background-color: rgba(0,60,136,0.5);
    .map-control {
      font-size: $toolbar_height - 0.7;
      height: $toolbar_height - 0.7;
      background-color: white;
      border-radius: 4px;
    }
    .ol-layer-selector {
      right: 0.2em;
      // position: absolute;
    }
  }
  .map-content{
    height: 95%;
    background-color: white;
    .ol-mouse-position {
      // par default en haut a droite
      // ici on deplace en bas a gauche
      top: unset;
      right: unset;
      bottom: 5px;
      left: 5px;
    }
  }

    .ol-zoom {
    top: $toolbar_height+1;
    .ol-zoom-in {
      width: $button_size;
      height: $button_size;
    }
    .ol-zoom-out {
      width: $button_size;
      height: $button_size;
    }
  }
  .gostatus{
    background-color: #1a1a1a;
    color: yellowgreen;
    padding: 2px;

  }
  .el-header {
    padding-left: 5px;
    padding-right: 5px;
    background-color: rgba(0,60,136,0.5);
    color: #333;
    text-align: left;
    line-height: 25px;
  }
  .el-select-dropdown__item{
   font-family: Arial ;
  }

</style>

<template>
  <div class="main">
    <slot></slot>
    <el-container>
      <el-header height="32px">
        <el-button-group v-show="editGeomEnabled">
          <!-- 
          <el-button id="cmdClear" type="warning" size="small" round @click="clearNewFeatures">Clear</el-button>
          -->

          <el-select v-if="isSmallScreen" id="modeSelector" :size="sizeOfControl"
              v-on:change="changeMode" v-model="uiMode"
              title="Cliquez pour sélectionner le mode de travail">
            <el-option
              v-for="item in modeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"></el-option>
          </el-select>
          <el-radio-group v-if="!isSmallScreen" v-model="uiMode" v-on:change="changeMode" :size="sizeOfControl"
                          title="Cliquez pour sélectionner le mode de travail">
            <el-radio-button v-for="item in modeOptions"
              :label="item.value" :key="item.value">{{item.label}}</el-radio-button>
          </el-radio-group>

        </el-button-group>
        <el-button id="cmdSave" v-show="editGeomEnabled" type="warning" :size="sizeOfControl"  @click="saveNewFeatures">Sauver</el-button>
        <span class="gostatus" v-show="(getNumPolygons > 0)">{{getNumPolygons}} Polygones</span>
        <el-select id="layerSelector" :size="sizeOfControl" style="float: right"
                   v-on:change="changeLayer" v-model="activeLayer"
                   title="Cliquez pour sélectionner le fond de plan">
          <el-option
            v-for="item in layerOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"></el-option>
        </el-select>
      </el-header>
    </el-container>


    <div ref="mymap" class="map-content"></div>
  </div>
</template>

<script>
  import {DEV, geoJSONUrl} from './config'
  import {Button, ButtonGroup, Container, Header, RadioGroup, Select, Option } from 'element-ui'
  
  import OlCollection from 'ol/collection'
  import OlFormatWKT from 'ol/format/wkt'
  import {isNullOrUndefined, dumpObject2String} from 'cgil-html-utils'
  import {
    getOlView,
    getOlMap,
    addGeoJSONPolygonLayer,
    initNewFeaturesLayer,
    setCreateMode,
    setModifyMode,
    setTranslateMode,
    getNumberFeaturesInLayer,
    getWktGeometryFeaturesInLayer,
    getMultiPolygonWktGeometryFromPolygonFeaturesInLayer,
    dumpFeatureToString,
    addWktPolygonToLayer,
    isValidPolygon,
    getNumVerticesPolygonFeature
  } from './OpenLayersSwiss21781'

  //this.$Vue.components(Container.name, Container)

  const positionGareLausanne = [537892.8, 152095.7]

  export default {
    name: 'vue2MapOlSwiss21781',
    components: {Button, Container, Header, RadioGroup, Select, Option},
    data () {
      return {
        msg: 'Basic OpenLayers Map',
        isSmallScreen: false,
        sizeOfControl: 'small',
        uiMode: 'NAVIGATE',
        ol_interaction_draw: null,
        ol_map: null,
        ol_view: null,
        ol_geoJSONLayer: null,
        maxFeatureIdCounter: 0, // to give an id to polygon features
        ol_newFeatures: null, // ol collection of features used as vector source for CREATE mode
        ol_newFeaturesLayer: null, // Vector Layer for storing new features
        ol_Active_Interactions: [],
        activeLayer: 'fonds_geo_osm_bdcad_couleur',
        modeOptions: [{
          value: 'NAVIGATE',
          label: 'Navigation'
        }, {
          value: 'CREATE',
          label: 'Création'
        }, {
          value: 'EDIT',
          label: 'Edition'
        }, {
          value: 'TRANSLATE',
          label: 'Déplacer'
        }],
        layerOptions: [{
          value: 'fonds_geo_osm_bdcad_couleur',
          label: 'Plan ville couleur'
        }, {
          value: 'fonds_geo_osm_bdcad_gris',
          label: 'Plan cadastral (gris)'
        }, {
          value: 'orthophotos_ortho_lidar_2016',
          label: 'Orthophotos 2016'
        }, {
          value: 'orthophotos_ortho_lidar_2012',
          label: 'Orthophotos 2012'
        }]
      }
    },
    props: {
      zoom: {
        type: Number,
        default: 13
      },
      center: {
        type: Array,
        default: () => (positionGareLausanne)
      },
      baseLayer: {
        type: String,
        default: 'fonds_geo_osm_bdcad_couleur'
      },
      editGeomEnabled: {
        type: Boolean,
        default: false
      },
      geomWkt: {
        type: String,
        default: null
      }
    },
    watch: {
      geomWkt: function () {
        this._updateGeometry()
      }
    },
    computed: {
      getNumPolygons: function () {
        return getNumberFeaturesInLayer(this.ol_newFeaturesLayer)
      }
    },
    methods: {
      _updateGeometry: function () {
        if (!isNullOrUndefined(this.geomWkt)) {
          // TODO check for identical features and do not add them twice
          const numFeaturesAdded = addWktPolygonToLayer(this.ol_newFeaturesLayer, this.geomWkt, this.maxFeatureIdCounter)
          if (isNullOrUndefined(numFeaturesAdded)) {
            console.log(`# ERROR tying to add this invalid Geom : ${this.geomWkt}`, this.geomWkt)
          } else {
            console.log(`Successfully added this geomWT to layer now layer has ${numFeaturesAdded} features !`)
            this.maxFeatureIdCounter += numFeaturesAdded
          }
        }
      },
      changeLayer: function (event) {
        let selectedLayer = null
        if (isNullOrUndefined(event.target)) {
          selectedLayer = this.activeLayer
        } else {
          selectedLayer = event.target.value
        }
        let layers = this.ol_map.getLayers()
        layers.forEach((layer) => {
          console.log(`## in changeLayer layers.forEach: layer = ${layer.get('title')}`, layer)
          let layerName = layer.get('source').layer_
          if (layer.get('type') === 'base') {
            if (layerName === selectedLayer) {
              layer.setVisible(true)
            } else {
              layer.setVisible(false)
            }
          }
        })
      },
      changeMode: function (event) {
        let selectedMode = null
        if (isNullOrUndefined(event.target)) {
          selectedMode = this.uiMode
        } else {
          selectedMode = event.target.value
        }
        if (DEV) console.log(`## in changeMode selectedMode = ${selectedMode}`)
        this.ol_Active_Interactions.forEach((Interaction) => {
          this.ol_map.removeInteraction(Interaction)
        })
        switch (selectedMode) {
          case 'NAVIGATE':
            break
          case 'CREATE':
            this.ol_interaction_draw = setCreateMode(
              this.ol_map,
              this.ol_newFeatures,
              this.ol_Active_Interactions,
              this.maxFeatureIdCounter,
              (newGeom) => {
                // here is a good place to save geometry
                const formatWKT = new OlFormatWKT()
                let featureWKTGeometry = formatWKT.writeFeature(newGeom)
                if (DEV) {
                  console.log(`## in changeMode callback for setCreateMode`, newGeom)
                  console.log(`** newGeom in wkt format : ${featureWKTGeometry}`)
                }
                let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
                this.$emit('gomapgeomchanged', wkt)
              })
            break
          case 'EDIT':
            setModifyMode(this.ol_map, this.ol_newFeaturesLayer, this.ol_Active_Interactions,
              (newGeom) => {
                console.log(`## in changeMode callback for setModifyMode`, newGeom)
                // console.log(`** newGeom in wkt format : ${featureWKTGeometry}`)
                let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
                this.$emit('gomapgeomchanged', wkt)
                console.log(`** BEGIN LAYER CONTENTS **\n${getWktGeometryFeaturesInLayer(this.ol_newFeaturesLayer)}\n** END LAYER CONTENTS **`)
              })
            break
          case 'TRANSLATE':
            // TODO simplify precision of coords after a translate
            setTranslateMode(this.ol_map, this.ol_newFeaturesLayer, this.ol_Active_Interactions)
            break
          default:
            if (DEV) console.log(`## in changeMode selectedMode = ${selectedMode} NOT IMPLEMENTED`)
        }
      },
      clearNewFeatures: function () {
        if (this.ol_newFeatures !== null) {
          this.ol_newFeatures.clear()
          this.ol_Active_Interactions.forEach((Interaction) => {
            this.ol_map.removeInteraction(Interaction)
          })
          this.uiMode = 'NAVIGATE'
        }
      },
      saveNewFeatures: function () {
        if (this.ol_newFeatures !== null) {
          let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
          this.$emit('gomapSaveGeomClick', wkt)
          this.showMessage(`Data SAVED ${wkt}`)
        }
      },
      showMessage: function (message, type = 'success') {
        const h = this.$createElement
        this.$message({
          message: h('p', null, [
            h('span', null, message),
            h('i', { style: 'color: teal' }, 'VNode')
          ]),
          type: type
        })
      }
    },
    mounted () {
      this.ol_view = getOlView(this.center, this.zoom)
      if (DEV) {
        // console.log(`geoJSONUrl : ${geoJSONUrl}`)
        // console.log(`geomWkt : ${this.geomWkt}`)
      }
      if (this.$refs.mymap.clientWidth < 626) {
        this.isSmallScreen = true
        this.sizeOfControl = 'mini'
      } else {
        this.isSmallScreen = false
        this.sizeOfControl = 'small'
      }
      this.ol_map = getOlMap(this.$refs.mymap, this.ol_view)
      this.ol_geoJSONLayer = addGeoJSONPolygonLayer(this.ol_map, geoJSONUrl)
      // this.ol_map.addLayer(this.ol_geoJSONLayer)
      this.ol_newFeatures = new OlCollection()
      this.ol_newFeaturesLayer = initNewFeaturesLayer(this.ol_map, this.ol_newFeatures)
      this._updateGeometry()
      // ## EVENTS ##
      this.ol_map.on('click',
        (evt) => {
          if (DEV) {
            console.log(`%c ## BEGIN GoMap click callback : ${Number(evt.coordinate[0]).toFixed(2)},${Number(evt.coordinate[1]).toFixed(2)}}`, 'background: #00f; color: #bada55')
            // console.log(`** BEGIN LAYER CONTENTS **\n${getWktGeometryFeaturesInLayer(this.ol_newFeaturesLayer)}\n** END LAYER CONTENTS **`)
            // let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
            // console.log(wkt)
          }
          if (this.uiMode === 'NAVIGATE') {
            this.ol_map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
              console.log(`## GoMap click evt feature detected : \n${dumpFeatureToString(feature)}`, feature)
              if (!isNullOrUndefined(layer)) console.log(`   feature found in layer : `, layer.get('name'))
              console.log(dumpObject2String(feature.getProperties()))
              this.$emit('selfeature', feature)
            })
          } else {
            if (this.uiMode === 'CREATE') {
              if (!isNullOrUndefined(this.ol_interaction_draw)) {
                if (this.ol_interaction_draw.getActive() === true) {
                  let numVertices = getNumVerticesPolygonFeature(this.ol_interaction_draw.currentFeature)
                  if (numVertices > 3) {
                    let ok = isValidPolygon(this.ol_interaction_draw.currentFeature, evt.coordinate)
                    if (ok) {
                      console.log(`%c ## GoMap click in CREATE MODE ${dumpFeatureToString(this.ol_interaction_draw.currentFeature)}`, 'background: #04f; color: #fdfefe', this.ol_interaction_draw.currentFeature)
                    } else {
                      console.log(`%c ## WARNING SELF-INTERSECT GoMap click in CREATE MODE ${dumpFeatureToString(this.ol_interaction_draw.currentFeature)}`, 'background: #f40; color: #fff', this.ol_interaction_draw.currentFeature)
                      this.ol_interaction_draw.removeLastPoint()
                    }
                  }
                }
              }
            }
            this.$emit('gomapclick', evt.coordinate)
          }
          console.log(`%c ## END GoMap click callback : ${Number(evt.coordinate[0]).toFixed(2)},${Number(evt.coordinate[1]).toFixed(2)}}`, 'background: #00f; color: #bada55')
        })
      window.onresize = () => {
        // this.$refs.mymap.clientHeight = window.innerHeight - 60
        // console.log(`screen clientWidth ${this.$refs.mymap.clientWidth}`)
        if (this.$refs.mymap.clientWidth < 626) {
          this.isSmallScreen = true
          this.sizeOfControl = 'mini'
        } else {
          this.isSmallScreen = false
          this.sizeOfControl = 'small'
        }
        this.ol_map.updateSize()
      }
    }
  }
</script>
