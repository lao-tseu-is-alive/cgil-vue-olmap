<!--suppress ALL -->
<style scoped lang="scss">

  @import "./ol.css";

  $toolbar_height: 2.0rem;
  $button_size: 1.6rem;

  .main {
    width: 100%;
    min-height: 400px;
    height: 100%;
    background-color: #062c33;
    margin: 0;
    padding: 0;
    overflow: hidden;
  }

  .tooltip {
    position: relative;
    padding: 3px;
    background: rgba(0, 0, 0, 0.5);
    color: white;
    opacity: 0.8;
    white-space: nowrap;
    font: 12pt sans-serif;
}

  /*
      .map-toolbar {
          height: $toolbar_height;
          background-color: rgba(0, 60, 136, 0.5);
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
  */
  .map-content {
    height: 100%;
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

  .gostatus {
    background-color: #1a1a1a;
    color: yellowgreen;
    padding: 2px;
    overflow: hidden;

  }

  .el-header {
    padding-left: 5px;
    padding-right: 5px;
    background-color: rgba(0, 60, 136, 0.5);
    color: #333;
    text-align: left;
    //line-height: 25px;
  }

  .el-select-dropdown__item {
    font-family: Arial;
  }

  .bg-edit-toolbar {
    background-color: rgba(0, 60, 136, 0.5);
    overflow: hidden;
  }

</style>

<template>
  <div ref="mainzone" class="main">
    <slot></slot>
      <el-container style="height: 100%">
        <el-header :height="toolbarHeight">
          <el-row type="flex" justify="space-between" class="row-bg" :gutter="1">
            <!--xs < 768px >= sm < 992px >= md < 1200px >= lg <1920px >= xl -->
            <el-col :xs="18" :sm="17" :md="14" :lg="14" :xl="13">
              <div class="grid-content bg-edit-toolbar" v-if="editGeomEnabled">
                <el-button-group>
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
                      :value="item.value">
                    </el-option>
                  </el-select>
                  <el-radio-group v-if="!isSmallScreen" v-model="uiMode" v-on:change="changeMode"
                                  :size="sizeOfControl"
                                  title="Cliquez pour sélectionner le mode de travail">
                    <el-radio-button v-for="item in modeOptions"
                                     :label="item.value" :key="item.value"
                                     border :size="sizeOfControl"
                                     :disabled="editDisabled(item.value)">{{item.label}}
                    </el-radio-button>
                  </el-radio-group>

                </el-button-group>
                <el-button id="cmdSave" v-show="editGeomEnabled " type="warning" :size="sizeOfControl" :disabled="!(getNumPolygons > 0)"
                           @click="saveNewFeatures">Sauver
                </el-button>
                <span class="gostatus" v-show="(getNumPolygons > 0) && !isSmallScreen">{{getNumPolygons}} Polygones</span>
                <template v-if="DEV">
                  <el-button type="primary" icon="el-icon-star-off"size="mini" circle
                  @click="_testCommand"></el-button>
                </template>
              </div>
              <div class="grid-content" v-if="!editGeomEnabled && searchEnabled">
                <!-- TODO trouver une solution qui evite les 2 cg-vue-auto-complete tout en etant responsive -->
                <cg-vue-auto-complete ref="mysearch"
                                      placeholder="Recherchez la position d'une adresse en entrant quelques caractères de celle-ci..."
                                      :size="sizeOfControl"
                                      :initial-ajax-data-source="geoAdrUrl"
                                      v-model="addressFound"
                                      @input="gotoSelectedAdr"
                                      @errorajax="aNetworkProblemHappened"
                ></cg-vue-auto-complete>
              </div>
            </el-col>
            <el-col :xs="0" :sm="4" :md="6" :lg="6" :xl="8">
              <div class="grid-content bg-purple-light" v-if="editGeomEnabled">
                <cg-vue-auto-complete ref="mysearch"
                                      placeholder="Recherchez la position d'une adresse en entrant quelques caractères de celle-ci..."
                                      :size="sizeOfControl"
                                      :initial-ajax-data-source="geoAdrUrl"
                                      v-model="addressFound"
                                      @input="gotoSelectedAdr"
                                      @errorajax="aNetworkProblemHappened"
                ></cg-vue-auto-complete>
              </div>
            </el-col>

            <!-- CONFIG -->
            <el-col :xs="1" :sm="1" :md="1" :lg="1" :xl="1">
              <div class="grid-content" style="margin-right: auto; margin-left: auto">
                <el-button :size="sizeOfControl" type="primary"
                           @click="toggleConfig()"
                           style=" float:right; right: 1px;"
                           icon="el-icon-setting">
                </el-button>
              </div>
            </el-col>
          </el-row>
          <template v-if="showConfig">
          <el-card class="box-card">
            <el-form label-position="left" :size="sizeOfControl">
              <el-form-item label="Commune (adresse):" :size="sizeOfControl">
                <el-select v-model="currentOfsFilter" placeholder="Select"
                           :size="sizeOfControl"
                           style=" float:right; right: 1px;"
                           @change="updateOfsFilter">
                  <el-option
                    v-for="item in arrListCities"
                    :key="item.ofs"
                    :label="item.label"
                    :value="item.ofs">
                  </el-option>
                </el-select>
              </el-form-item>
              <el-form-item label="Fond de plan :" :size="sizeOfControl">
                <el-select :size="sizeOfControl"
                           v-on:change="changeLayer" v-model="activeLayer"
                           style=" float:right; right: 1px;"
                           title="Cliquez pour sélectionner le fond de plan">
                  <el-option
                    v-for="item in layerOptions"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value">
                  </el-option>
                </el-select>
              </el-form-item>
            </el-form>
          </el-card>
            </template>
        </el-header>
        <el-main  style="padding: 0">
          <div id="mymap" ref="mymap" class="map-content">
            <div ref="tooltip" class="tooltip"></div>
          </div>
        </el-main>
      </el-container>
    </div>
</template>

<script>
/* eslint-disable */
import {BASE_REST_API_URL, DEV, geoJSONUrl} from './config'
/* TODO : test a way to include only what i need from element-ui
   in the mean time you need to
   import ElementUI from 'element-ui'
   import 'element-ui/lib/theme-chalk/index.css'
   Vue.use(ElementUI)
  import {Button, ButtonGroup, Container, Header, RadioGroup, Select, Option } from 'element-ui'
  */
import OlCollection from 'ol/Collection'
import OlFormatWKT from 'ol/format/WKT'
import OlOverlay from 'ol/Overlay'
import {dumpObject2String, isNullOrUndefined} from 'cgil-html-utils'
import Log from 'cgil-log'
// not using cgil-vue-autocomplete npm to handle element-ui integration
import cgVueAutoComplete from './cgil-vue-autocomplete-element-ui'
import {
  addGeoJsonPolygonToLayer,
  loadGeoJsonUrlPolygonLayer,
  addWktPolygonToLayer,
  dumpFeatureToString,
  flyTo,
  getMultiPolygonWktGeometryFromPolygonFeaturesInLayer,
  getNumberFeaturesInLayer,
  getNumVerticesPolygonFeature,
  getOlMap,
  getOlView,
  getWktGeometryFeaturesInLayer,
  getWktGeomFromFeature,
  initNewFeaturesLayer,
  isValidPolygon,
  isValidFeature,
  setCreateMode,
  setModifyMode,
  setTranslateMode,
  setDeleteMode,
} from './OpenLayersSwiss21781'

import listCities from './communesBBLidar2012'

// this.$Vue.components(Container.name, Container)

const positionGareLausanne = [537892.8, 152095.7]
const SMALL_SCREEN_WIDTH = 638 // smaller then the xs at <768 but at purpose !
const MEDIUM_SCREEN_WIDTH = 992
const MIN_HEIGHT = 600
const TOOLBARHEIGHT = 34
const MODULE_NAME = 'cgilVueOlMap'
const log = (DEV) ? new Log(MODULE_NAME, 4) : new Log(MODULE_NAME, 1);


export default {
  name: 'vue2MapOlSwiss21781',
  components: {cgVueAutoComplete},
  data () {
    return {
      DEV,
      toolbarHeight: `${TOOLBARHEIGHT}px`,
      mapHeight: `${MIN_HEIGHT}px`,
      isSmallScreen: false,
      showConfig: false,
      sizeOfControl: 'small',
      uiMode: 'NAVIGATE',
      ol_interaction_draw: null,
      ol_map: null,
      ol_view: null,
      maxFeatureIdCounter: 0, // to give an id to polygon features
      ol_newFeatures: null, // ol collection of features used as vector source for CREATE mode
      ol_newFeaturesLayer: null, // Vector Layer for storing new features
      ol_GeoJsonFeaturesLayer: null, // Vector Layer for storing external GeoJson
      ol_Overlay: null, // Overlay to display tooltip
      ol_Active_Interactions: [],
      activeLayer: 'fonds_geo_osm_bdcad_couleur',
      addressFound: null, // selected address to search
      currentOfsFilter: 0,
      arrListCities: [],
      geoAdrUrl: `${BASE_REST_API_URL}adresses/search_position?ofs=${this.ofsFilter}`, // backend to find address
      modeOptions: [{
        value: 'NAVIGATE',
        label: 'Naviguer',
      }, {
        value: 'CREATE',
        label: 'Créer',
      }, {
        value: 'EDIT',
        label: 'Editer',
      }, {
        value: 'TRANSLATE',
        label: 'Déplacer',
      }, {
        value: 'DELETE',
        label: 'Supprimer',
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
    baselayer: {
      type: String,
      default: 'fonds_geo_osm_bdcad_couleur'
    },
    useInternalWmts: { // will use lausanne internal 'https://tiles01.lausanne.ch/tiles' instead of public one
      type: Boolean,
      default: false
    },
    editGeomEnabled: { // goign from true to false will triger a call to clearNewFeatures to reset mode to navigate and clear current editing
      type: Boolean,
      default: false
    },
    searchEnabled: {
      type: Boolean,
      default: false
    },
    geomWkt: { // this geometry in WKT format wil be editable
      type: String,
      default: null
    },
    geomGeoJSON: { // this geometry in geomJSON format wil be editable
      type: Object,
      default: null
    },
    geojsonurl: { // this one allows to add an url to get remote geojson layer , stored in ol_vector_layer_geojsonurl
      type: String,
      default: '',
    },
    ofsFilter: {
      type: Number,
      default: 0 // 0 to allow search address on all cities in city area, 5586 use lausanne only,
    },
    geojsondata: {  //read only layer for geojson vector data display on the map, stored in ol_vector_layer_geojsondata
      type: Object,
      default: null,
    },
  },
  watch: {
    geomWkt: function () {
      // TODO : here is a good place to see if change is really a different geometry from previous
      this._updateGeometry()
    },
    geomGeoJSON: function () {
      this._updateGeometry()
    },
    geojsondata:  function (newValue, oldValue){
      log.t(`## in geojsondata watch old: ${oldValue}, new: ${newValue}`)
    },
    editGeomEnabled: function (newValue, oldValue) {
      log.t(`## in editGeomEnabled watch old: ${oldValue}, new: ${newValue}`)
      if (newValue === false && oldValue === true)  this.clearNewFeatures()
    }
  },
  computed: {
    getNumPolygons: function () {
      return getNumberFeaturesInLayer(this.ol_newFeaturesLayer)
    },
  },
  updated: function () {
    log.t(`## in updated $nextTick`)
    this.$nextTick(function () {
      this.updateScreen();
      // Code that will run only after the
      // entire view has been re-rendered
    })
  },
  methods: {
    runFunction(name, params = null) {
      const fn = this[name];
      if (typeof fn !== 'function') return;
      fn.apply(this, params);
    },
    editDisabled: function (mode) {
      if ((mode == 'NAVIGATE') || (mode == 'CREATE')) {
        return false
      } else {
        const isEditDisabled = (this.getNumPolygons < 1)
        // log.t(`## in editDisabled computed is EditValid: ${isEditDisabled}`)
        return isEditDisabled
      }
    },
    _updateGeometry: function () {
      log.t(`# in _updateGeometry geomWkt : ${this.geomWkt}\n geomGeoJSON: ${this.geomGeoJSON}`)
      if ((!isNullOrUndefined(this.geomWkt)) && (this.geomWkt.length > 5)) {
        log.t(`# in _updateGeometry for geomWkt`, this.geomWkt)
        // TODO check for identical features and do not add them twice or clear layer before ?
        const numFeaturesAdded = addWktPolygonToLayer(this.ol_newFeaturesLayer, this.geomWkt, this.maxFeatureIdCounter)
        if (isNullOrUndefined(numFeaturesAdded)) {
          log.e(`# ERROR tying to add this invalid Geom from geomWkt : ${this.geomWkt}`, this.geomWkt)
        } else {
          log.l(`Successfully added this geomWkt to layer now layer has ${numFeaturesAdded} features !`)
          this.maxFeatureIdCounter += numFeaturesAdded
        }
      }
      if (!isNullOrUndefined(this.geomGeoJSON)) {
        // TODO check for identical features and do not add them twice or clear layer before ?
        log.t(`# in _updateGeometry for geomGeoJSON`, this.geomGeoJSON)
        const numFeaturesAdded = addGeoJsonPolygonToLayer(this.ol_newFeaturesLayer, this.geomGeoJSON, this.maxFeatureIdCounter)
        if (isNullOrUndefined(numFeaturesAdded)) {
          log.e(`# ERROR in _updateGeometry tying to add this invalid Geom from geomGeoJSON: ${this.geomGeoJSON}`, this.geomGeoJSON)
        } else {
          log.l(`in _updateGeometry successfully added this geomGeoJSON to layer now layer has ${numFeaturesAdded} features !`)
          this.maxFeatureIdCounter += numFeaturesAdded
        }
      }
      if (getNumberFeaturesInLayer(this.ol_newFeaturesLayer) > 0) {
         log.t(`# in _updateGeometry adjusting view to extent of features:`, )
        // cgil added 2 lines of code to recenter the view to the actual geometry layer
        const extent = this.ol_newFeaturesLayer.getSource()
                           .getExtent();
        log.l(`# in _updateGeometry extent :`, extent)
        this.ol_map.getView()
            .fit(extent, this.ol_map.getSize());
      }
    },
    _testCommand: function() {
      this.gotoNewPos([535895.58, 153129.57])
      const olLayers = this.ol_map.getLayers()
      olLayers.forEach((layer, i, a) => {
        if (layer.type == 'VECTOR') {
          const numFeatures = getNumberFeaturesInLayer(layer)
          log.w(`# in _testCommand Layer(${i}) type: ${layer.type} name: ${layer.get('name')} num:${numFeatures}`, layer)
        }
      })

      //const t = this.ol_map.features.map(o => o.properties);
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
        log.l(`## in changeLayer layers.forEach: layer = ${layer.get('title')}`, layer)
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
      if (DEV) log.l(`## in changeMode selectedMode = ${selectedMode}`)
      this.ol_Active_Interactions.forEach((Interaction) => {
        this.ol_map.removeInteraction(Interaction)
      })
      switch (selectedMode) {
        case 'NAVIGATE':
          break
        case 'CREATE':
          // TODO TEST VALIDITY OF NEW GEOMETRY IN CREATE MODE, not only when editing
          this.ol_interaction_draw = setCreateMode(
            this.ol_map,
            this.ol_newFeatures,
            this.ol_Active_Interactions,
            this.maxFeatureIdCounter,
            (newGeom) => {
              // here is a good place to save geometry
              const formatWKT = new OlFormatWKT()
              let featureWKTGeometry = formatWKT.writeFeature(newGeom)
              if (isValidFeature(newGeom)) {
                log.t(`## in changeMode CREATE callback for setCreateMode  OK GEOM VALID ${dumpFeatureToString(newGeom)}`)
                this.maxFeatureIdCounter += 1;
              } else {
                log.e(`## in changeMode CREATE callback for setCreateMode  KO GEOM INVALID ${dumpFeatureToString(newGeom)}`)
                this.showMessage(`ATTENTION : Ce dernier polygone est INVALIDE ! Veuillez le corriger SVP `, 'error')
              }
              let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
              this.$emit('gomapgeomchanged', wkt)
            })
          break
        case 'EDIT':
          setModifyMode(this.ol_map, this.ol_newFeaturesLayer, this.ol_Active_Interactions,this.maxFeatureIdCounter,
            (newGeom) => {
            log.t(`## in changeMode EDIT callback for setModifyMode ${dumpFeatureToString(newGeom)}`, newGeom)
              if (isValidFeature(newGeom)) {
                log.t(`## in changeMode EDIT callback for setModifyMode  OK GEOM VALID ${dumpFeatureToString(newGeom)}`)
              } else {
                log.e(`## in changeMode EDIT callback for setCreateMode  KO GEOM INVALID ${dumpFeatureToString(newGeom)}`)
                this.showMessage(`ATTENTION : Ce dernier polygone est INVALIDE ! Veuillez le corriger SVP `, 'error')
              }
              let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
              this.$emit('gomapgeomchanged', wkt)
              log.l(`## in changeMode EDIT callback for setModifyMode
              ** BEGIN LAYER CONTENTS **\n${getWktGeometryFeaturesInLayer(this.ol_newFeaturesLayer)}\n** END LAYER CONTENTS **`)
            })
          break
        case 'TRANSLATE':
          setTranslateMode(this.ol_map, this.ol_newFeaturesLayer, this.ol_Active_Interactions)
          break
        case 'DELETE':
          setDeleteMode(this.ol_map, this.ol_newFeaturesLayer, this.ol_Active_Interactions, this.maxFeatureIdCounter)
          break
        default:
          if (DEV) log.w(`## in changeMode selectedMode = ${selectedMode} NOT IMPLEMENTED`)
      }
    },
    clearNewFeatures: function () {
      log.t(`## in clearNewFeatures`)
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
      }
    },
    showMessage: function (message, type = 'success') {
      const h = this.$createElement
      this.$message({
        message: h('p', null, [
          h('span', null, message),
          h('i', {style: 'color: teal'}, 'VNode')
        ]),
        type: type
      })
    },

    gotoNewPos: function (arrCoordPos, zoomLevel=7) {
      if (!isNullOrUndefined(arrCoordPos)) {
        log.t(`# gotoNewPos x,y = (${arrCoordPos[0]},${arrCoordPos[1]}) zoom = ${zoomLevel}`)
        const newPos = [ Number.parseFloat(arrCoordPos[0]) , Number.parseFloat(arrCoordPos[1])]
        flyTo(newPos, zoomLevel, this.ol_view, (v) => {
          log.t(`# gotoNewPos x,y = (${arrCoordPos[0]},${arrCoordPos[1]}) zoom = ${zoomLevel} flyTo callback`, v)
        })
      }
    },

    gotoSelectedAdr: function (objSelected) {
      log.t(`# gotoSelectedAdr`, objSelected)
      if (!isNullOrUndefined(objSelected)) {
        // this.arrSelectionsAdresse.push(objSelected)
        if (!isNullOrUndefined(objSelected.id)) {
          const arrCoords = objSelected.id.split('_')
          const newPos = [ Number.parseFloat(arrCoords[0]) , Number.parseFloat(arrCoords[1])]
          this.ol_view.setCenter(newPos)
          this.ol_view.setZoom(9)
        }
      }
    },
    aNetworkProblemHappened: function (msg) {
      log.e(`aNetworkProblemHappened --> ${msg}`)
      this.showMessage(`ATTENTION : Il y a eut un problème réseau ${msg}`, 'error')
    },
    toggleConfig: function () {
      this.showConfig = !this.showConfig
      this.toolbarHeight = this.showConfig ? '166px' : '34px'
    },
    updateOfsFilter: function (val) {
      log.t(`# updateOfsFilter new citiy filter :${this.currentOfsFilter}`, val)
      this.geoAdrUrl = `${BASE_REST_API_URL}adresses/search_position?ofs=${this.currentOfsFilter}`
      this.$refs.mysearch.setAjaxDataSource(this.geoAdrUrl)
    },
    updateScreen: function () {
      if (!isNullOrUndefined(this.$refs.mainzone)) {
        /*
        log.t(
        `# updateScreen screen mainzone Width x Height : ${this.$refs.mainzone.clientWidth} x ${this.$refs.mainzone.clientHeight}`)
        */
        this.$refs.mymap.style.height = `${this.$refs.mainzone.clientHeight - TOOLBARHEIGHT}px`;
        if (this.$refs.mainzone.clientWidth > 0) {
          //log.l(`# updateScreen screen this.$refs.mymap.clientWidth ${ this.$refs.mymap.clientWidth}`)
          if (this.$refs.mymap.clientWidth < SMALL_SCREEN_WIDTH) {
            this.isSmallScreen = true
            this.sizeOfControl = 'mini'
          } else {
            this.isSmallScreen = false
            this.sizeOfControl = 'small'
          }
          if (this.$refs.mymap.clientWidth > MEDIUM_SCREEN_WIDTH) {
            if (this.showConfig === true) {
              // this.toggleConfig()
            }
          }
          this.ol_map.updateSize()
        } else {
          log.l(`## updateScreen screen main WxH: ${this.$refs.mainzone.clientWidth} x ${this.$refs.mainzone.clientHeight}`, this.$refs.mainzone)
          log.l(`## updateScreen screen mymap WxH: ${this.$refs.mymap.clientWidth} x ${this.$refs.mymap.clientHeight}`, this.$refs.mymap)
          const refThis = this
          window.setTimeout(function () {
            log.l(`### setTimeout in updateScreen main WxH: ${refThis.$refs.mainzone.clientWidth} x ${refThis.$refs.mainzone.clientHeight}`)
            log.l(`### setTimeout in updateScreen mymap WxH: ${refThis.$refs.mymap.clientWidth} x ${refThis.$refs.mymap.clientHeight}`)
            //let x = (refThis.ol_map).renderer.canvas_;
            refThis.$refs.mainzone.style.display = 'block';
            refThis.$refs.mymap.style.display = 'block';
            // next line because of : https://github.com/openlayers/openlayers/issues/4817
            // and of : https://github.com/openlayers/openlayers/issues/8888
            // thank you so much ol for doing such "strange" things like putting display:none in your canvas...
            // can also do : m=document.getElementById('mymap'); m.getElementsByTagName('canvas')[0].style.display=''
            refThis.$refs.mymap.getElementsByTagName('canvas')[0].style.display=''
            refThis.ol_map.render();
            refThis.ol_map.updateSize()
          }, 500)
        }
      } else {
        log.t(`# updateScreen screen Width x Height : this.$refs.mainzone is undefined`, this.$refs.mainzone)
      }
    }
  }, // end of methods section
  mounted () {
    log.t(`## in mounted `)
    this.currentOfsFilter = this.ofsFilter // on fixe la valeur initiale de la commune
    this.geoAdrUrl = `${BASE_REST_API_URL}adresses/search_position?ofs=${this.currentOfsFilter}`
    // this.$refs.mysearch.setAjaxDataSource(this.geoAdrUrl)
    this.arrListCities = listCities
    if (this.useInternalWmts) {
      this.layerOptions.push( {
        value: 'fonds_geo_conduites',
        label: 'Plan cadastral souterrain (gris)'
      }
      )
    }
    this.ol_view = getOlView(this.center, this.zoom)
    if (this.$refs.mymap.clientWidth < 626) {
      this.isSmallScreen = true
      this.sizeOfControl = 'mini'
    } else {
      this.isSmallScreen = false
      this.sizeOfControl = 'small'
    }
    this.activeLayer = this.baselayer;
    this.ol_map = getOlMap(this.$refs.mymap,
                           this.ol_view,
                           this.baselayer,
                           this.geojsondata, null, this.useInternalWmts )
    if (this.geojsonurl.length > 4) {
      log.l(`will enter in loadGeoJsonUrlPolygonLayer(geojsonurl:${this.geojsonurl}`);
      loadGeoJsonUrlPolygonLayer(this.ol_map, this.geojsonurl,
                                 (newOlLayer) => { log.l('callback for loadGeoJsonUrlPolygonLayer layer:', newOlLayer)},
                                 'ol_vector_layer_geojsonurl');
    }
    this.ol_newFeatures = new OlCollection()
    this.ol_newFeaturesLayer = initNewFeaturesLayer(this.ol_map, this.ol_newFeatures)
    this._updateGeometry()
    this.updateScreen()
    // OVERLAY FOR TOOLTIP
    this.ol_Overlay = new OlOverlay ({
                     element: this.$refs.tooltip,
                     offset: [10, 0],
                     positioning: 'bottom-center'
                   })
    this.ol_map.addOverlay(this.ol_Overlay)

    // ## EVENTS ##
    this.ol_map.on('pointermove',
      (evt) => {
      const localDebug = false
      if (this.uiMode === 'CREATE') return;
      let features = [];
      const x = Number(evt.coordinate[0]).toFixed(2);
      const y = Number(evt.coordinate[1]).toFixed(2);
      let info = {
        coordinates: [x, y],
        numFeaturesDetected :  0
      };
      const lastfeature = this.ol_map.forEachFeatureAtPixel(
            evt.pixel,
            (feature, layer) => {
              let layerName = ''
              if (!isNullOrUndefined(layer)) {
                layerName = layer.get('name')
                if (localDebug) log.l(`feature found in layer : "${layerName}"`)
              }
              const feature_props = feature.getProperties();
              if (localDebug) log.l(`# GoMap pointermove EVENT, feature detected :\n${dumpFeatureToString(feature)}`)
              if (!isNullOrUndefined(feature_props)) {
                const feature_info = {
                  id:feature_props.id,
                  feature : feature,
                  layer: layerName,
                  data: feature_props
              }
                //log.l(`Feature id : ${feature_props.id}, info:`, info);
                features.push(feature_info)
              } else {
                features.push({
                  id:0,
                  feature : feature,
                  layer: layerName,
                })
              }
              //return feature
            }); //end of forEachFeatureAtPixel
          if (features.length > 0) {
            if (localDebug) log.l('GoMap pointermove EVENT ->Array of features found :', features);
            info.numFeaturesDetected = features.length;
            info.features = features;
            let strToolTip = ''
            features.forEach((feat_info) =>{
              const currentTitle = feat_info.data.title
              if (!isNullOrUndefined(currentTitle) ) {
                strToolTip += currentTitle.replace(/(<([^>]+)>)/ig,"") + '<br>';
                if (!isValidFeature(feat_info.feature)){
                  strToolTip += '<em> ## ATTENTION CETTE GEOMETRIE EST INVALIDE ! ##</em><br>';
                }
              }
            })
            if (strToolTip.length > 0) {
              this.ol_Overlay.setPosition(evt.coordinate);
              this.$refs.tooltip.style.display = '';
              this.$refs.tooltip.innerHTML = strToolTip;
            } else {
              this.$refs.tooltip.innerHTML = ''
              this.$refs.tooltip.style.display = 'none';
            }

          } else {
            info.numFeaturesDetected = 0;
            info.features = null;
            this.$refs.tooltip.style.display = 'none';
          }

      })
    this.ol_map.on('click',
      (evt) => {
      const x = Number(evt.coordinate[0]).toFixed(2);
      const y = Number(evt.coordinate[1]).toFixed(2);
      let info = {
        coordinates: [x, y],
        numFeaturesDetected :  0
      };
      let features = [];
        if (DEV) {
          log.t(`## BEGIN GoMap click callback : ${x},${y}`)
          // log.l(`** BEGIN LAYER CONTENTS **\n${getWktGeometryFeaturesInLayer(this.ol_newFeaturesLayer)}\n** END LAYER CONTENTS **`)
          // let wkt = getMultiPolygonWktGeometryFromPolygonFeaturesInLayer(this.ol_newFeaturesLayer)
          // log.l(wkt)
        }
        if (this.uiMode === 'NAVIGATE') {
          const lastfeature = this.ol_map.forEachFeatureAtPixel(
            evt.pixel,
            (feature, layer) => {
              let layerName = ''
              if (!isNullOrUndefined(layer)) {
                layerName = layer.get('name')
                log.l(`feature found in layer : "${layerName}"`)
              }
              const feature_props = feature.getProperties();
              log.l(`# GoMap click in NAVIGATE mode, feature detected :\n
                ${dumpFeatureToString(feature)}`)
              this.$emit('selfeature', feature)
              const wkt = getWktGeomFromFeature(feature)
              if (!isNullOrUndefined(feature_props)) {
                const feature_info = {
                  id:feature_props.id,
                  layer: layerName,
                  geometryWKT: wkt,
                  data: feature_props
              }
                log.l(`Feature id : ${feature_props.id}, info:`, info);
                features.push(feature_info)
              }
              //return feature
            });
          if (features.length > 0) {
            log.l('->Array of features found :', features);
            info.numFeaturesDetected = features.length;
            info.features = features;
          } else {
            info.numFeaturesDetected = 0;
            info.features = null;
          }
          this.$emit('mapclick', info);

          if (!isNullOrUndefined(lastfeature)) {
            log.l('->Feature found :', lastfeature);
            /*const val = feature.getProperties();
            if (!isNullOrUndefined(val)) {
              const info = {coordinates: [x, y], id: val.id, data: val};
              log.l(`Feature id : ${val.id}, info:`, info);
              this.$emit('mapclick', info);
              // case of an iframe containing a function getMapClickCoordsXY
              // removed for now beacaused it get called also when no iln -sframe
              // if (typeof (window.parent.getMapClickCoordsXY) !== 'undefined') {
              //  window.parent.getMapClickCoordsXY(info);
              // }
              // case of a function getMapClickCoordsXY in global context in window
              if (typeof (window.getMapClickCoordsXY) !== 'undefined') {
                window.getMapClickCoordsXY(info);
              }
            }*/
          }
        } else {
          if (this.uiMode === 'CREATE') {
            if (!isNullOrUndefined(this.ol_interaction_draw)) {
              if (this.ol_interaction_draw.getActive() === true) {
                let numVertices = getNumVerticesPolygonFeature(this.ol_interaction_draw.currentFeature)
                log.t(`## GoMap click in CREATE MODE ${x},${y} nombre sommets : ${numVertices}`)
               /* j'enleve ce code qui bloque la création de certain polygones qui seront au final correct
               // on controle si le polygone est valide uniquement à la fin
                if (numVertices > 3) {
                  let ok = isValidPolygon(this.ol_interaction_draw.currentFeature, evt.coordinate)
                  if (ok) {
                    log.t(`## GoMap click in CREATE MODE ${dumpFeatureToString(this.ol_interaction_draw.currentFeature)}`, this.ol_interaction_draw.currentFeature)
                  } else {
                    log.w(`## WARNING SELF-INTERSECT GoMap click in CREATE MODE ${dumpFeatureToString(this.ol_interaction_draw.currentFeature)}`, this.ol_interaction_draw.currentFeature)
                    this.ol_interaction_draw.removeLastPoint()
                  }
                }
                */
              }
            }
          }
          this.$emit('gomapclick', evt.coordinate)
        }
        log.t(`## END GoMap click callback : ${Number(evt.coordinate[0]).toFixed(2)},${Number(evt.coordinate[1]).toFixed(2)}`)
      })
    window.onresize = () => {
      log.l(`## GoMap IN onresize client Width x Height : ${this.$refs.mainzone.clientWidth} x ${this.$refs.mainzone.clientHeight}`)
      this.ol_map.updateSize()
      this.updateScreen()
    }
    // window.onclick = (e) => { log.l(`## GoMap IN windowonclick client Width x Height : `, e) }
  }
}
</script>
