import {DEV} from './config'
import {dumpObject2String, functionExist, isNullOrUndefined} from 'cgil-html-utils'
import Log from 'cgil-log';
import OlMap from 'ol/Map'
import OlView from 'ol/View'
import OlCollection from 'ol/Collection'
import OlCircle from 'ol/style/Circle'
import {singleClick, shiftKeyOnly, altKeyOnly} from 'ol/events/condition'
import OlFeature from 'ol/Feature'
import OlFill from 'ol/style/Fill'
import OlFormatGeoJSON from 'ol/format/GeoJSON'
import OlFormatWKT from 'ol/format/WKT'
import OlInteractionDraw from 'ol/interaction/Draw'
import OlInteractionModify from 'ol/interaction/Modify'
import OlInteractionSelect from 'ol/interaction/Select'
import OlInteractionTranslate from 'ol/interaction/Translate'
import OlLayerVector from 'ol/layer/Vector'
import OlLayerTile from 'ol/layer/Tile'
import OlMousePosition from 'ol/control/MousePosition'
import OlMultiPolygon from 'ol/geom/MultiPolygon'
// import OlPolygon from 'ol/geom/polygon'
import OlMultiPoint from 'ol/geom/MultiPoint'
import {defaults as defaultControls} from 'ol/control';
import {createStringXY} from 'ol/coordinate'
import olObservable from 'ol/Observable'
import {addProjection, get} from 'ol/proj'
import {register} from 'ol/proj/proj4'
import OlProjection from 'ol/proj/Projection'
import OlSourceVector from 'ol/source/Vector'
import OlSourceWMTS from 'ol/source/WMTS'
import OlStroke from 'ol/style/Stroke'
import OlStyle from 'ol/style/Style'
import OlTileGridWMTS from 'ol/tilegrid/WMTS'
import proj4 from 'proj4'
import {distance2Point, pointsIsEqual, EPSILON, polygonSelfIntersect} from './2dGeom'
// we want to limit minimum distance of points of same polygon
export const MIN_DISTANCE_BETWEEN_POINTS = 0.5
export const DIGITIZE_PRECISION = 2 // cm is enough in EPSG:21781 inside a browser
const MODULE_NAME='OpenLayersSwiss21781';
const log = (DEV) ? new Log(MODULE_NAME, 4) : new Log(MODULE_NAME, 2);

const RESOLUTIONS = [50, 20, 10, 5, 2.5, 1, 0.5, 0.25, 0.1, 0.05]
const MAX_EXTENT_LIDAR = [532500, 149000, 545625, 161000] // lidar 2012
proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=674.4,15.1,405.3,0,0,0,0 +units=m +no_defs')
proj4.defs('EPSG:2056', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs');

// https://openlayers.org/en/latest/examples/reprojection.html
// https://openlayers.org/en/latest/doc/faq.html#how-do-i-change-the-projection-of-my-map-
//proj4.defs('EPSG:21781','+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs');

register(proj4);
const olSwissProjection = get('EPSG:21781');
//olSwissProjection.setExtent([485071.54, 75346.36, 828515.78, 299941.84]);
olSwissProjection.setExtent(MAX_EXTENT_LIDAR);


const swissProjection = new OlProjection({
  code: get('EPSG:21781'),
  extent: MAX_EXTENT_LIDAR,
  units: 'm'
})
addProjection(swissProjection)
/*
      // https://golux.lausanne.ch/goeland/objet/pointfixe.php?idobjet=111351
      const coordPfa180Stfrancois = [538224.21, 152378.17] // PFA3 180 - St-Francois
      console.log(`PFA3 180 - St-Francois en 21781 : ${coordPfa180Stfrancois[0]}, ${coordPfa180Stfrancois[1]}`)
      const pfa180In4326 = Conv21781To4326(coordPfa180Stfrancois[0], coordPfa180Stfrancois[1])
      console.log(`PFA3 180 - St-Francois en 4326  : ${pfa180In4326.x}, ${pfa180In4326.y} `)
*/
export function Conv21781To4326 (x, y) {
  const projSource = new proj4.Proj('EPSG:21781')
  const projDest = new proj4.Proj('EPSG:4326')
  return proj4.transform(projSource, projDest, [x, y])
}
// 2056 MN95 new Swiss Projection
export function Conv21781To2056 (x, y) {
  const projSource = new proj4.Proj('EPSG:21781')
  const projDest = new proj4.Proj('EPSG:2056')
  return proj4.transform(projSource, projDest, [x, y])
}

export function Conv4326To21781 (x, y) {
  const projSource = new proj4.Proj('EPSG:4326')
  const projDest = new proj4.Proj('EPSG:21781')
  return proj4.transform(projSource, projDest, [x, y])
}

export function Conv3857To21781 (x, y) {
  const projSource = new proj4.Proj('EPSG:3857')
  const projDest = new proj4.Proj('EPSG:21781')
  return proj4.transform(projSource, projDest, [x, y])
}

const overlayStyle = (function () {
  /* jshint -W069 */
  const styles = {}
  styles['Polygon'] = [
    new OlStyle({
      fill: new OlFill({
        color: [255, 255, 255, 0.5]
      })
    }),
    new OlStyle({
      stroke: new OlStroke({
        color: [255, 255, 255, 1],
        width: 5
      })
    }),
    new OlStyle({
      stroke: new OlStroke({
        color: [0, 153, 255, 1],
        width: 3
      })
    })]
  styles['MultiPolygon'] = styles['Polygon']

  styles['LineString'] = [
    new OlStyle({
      stroke: new OlStroke({
        color: [255, 255, 255, 1],
        width: 5
      })
    }),
    new OlStyle({
      stroke: new OlStroke({
        color: [0, 153, 255, 1],
        width: 3
      })
    })]
  styles['MultiLineString'] = styles['LineString']

  styles['Point'] = [
    new OlStyle({
      image: new OlCircle({
        radius: 7,
        fill: new OlFill({
          color: [0, 153, 255, 1]
        }),
        stroke: new OlStroke({
          color: [255, 255, 255, 0.75],
          width: 1.5
        })
      }),
      zIndex: 100000
    })]
  styles['MultiPoint'] = styles['Point']

  styles['GeometryCollection'] = styles['Polygon'].concat(styles['Point'])

  return function (feature, resolution) {
    return styles[feature.getGeometry().getType()]
  }
  /* jshint +W069 */
})()

function initWmtsLayers ( initialBaseLayer, useInternalWmts = false) {
  log.t(`# in initWmtsLayers(baselayer=${initialBaseLayer}`)
  const internalBaseWmtsUrl = 'https://tiles01.lausanne.ch/tiles'
  const externalBaseWmtsUrl = 'https://map.lausanne.ch/tiles'
  let arrayWmts = []
  const baseWmtsUrl  = useInternalWmts ? internalBaseWmtsUrl : externalBaseWmtsUrl
  
    /**
   * Allow to retrieve a valid OpenLayers WMTS source object
   * @param {string} layer  : the name of the WMTS layer
   * @param {object} options
   * @return {ol.source.WMTS} : a valid OpenLayers WMTS source
   */
  function wmtsLausanneSource (layer, options) {
    let resolutions = RESOLUTIONS
    log.t(`# in wmtsLausanneSource(baseWmtsUrl=${baseWmtsUrl}, layer=${layer}`)
    if (Array.isArray(options.resolutions)) {
      resolutions = options.resolutions
    }
    const tileGrid = new OlTileGridWMTS({
      origin: [420000, 350000],
      resolutions: resolutions,
      matrixIds: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    })
    const extension = options.format || 'png'
    const timestamp = options.timestamps
    let url = baseWmtsUrl + '/1.0.0/{Layer}/default/' + timestamp +
      '/swissgrid_05/{TileMatrix}/{TileRow}/{TileCol}.' + extension
    url = url.replace('http:', location.protocol)
    // noinspection ES6ModulesDependencies
    return new OlSourceWMTS(/** @type {olx.source.WMTSOptions} */{
      // crossOrigin: 'anonymous',
      attributions: `&copy;<a "href='http://www.lausanne.ch/cadastre>Cadastre'>SGLEA-C Lausanne</a>`,
      url: url,
      tileGrid: tileGrid,
      layer: layer,
      requestEncoding: 'REST'
    })
  }
  
  arrayWmts.push(new OlLayerTile({
    title: 'Plan ville couleur',
    type: 'base',
    visible: (initialBaseLayer === 'fonds_geo_osm_bdcad_couleur'),
    source: wmtsLausanneSource('fonds_geo_osm_bdcad_couleur', {
      timestamps: [2015],
      format: 'png'
    })
  }))
  arrayWmts.push(new OlLayerTile({
    title: 'Plan cadastral (gris)',
    type: 'base',
    visible: (initialBaseLayer === 'fonds_geo_osm_bdcad_gris'),
    source: wmtsLausanneSource('fonds_geo_osm_bdcad_gris', {
      timestamps: [2015],
      format: 'png'
    })
  }))
  arrayWmts.push(new OlLayerTile({
    title: 'Orthophoto 2012',
    type: 'base',
    visible: (initialBaseLayer === 'orthophotos_ortho_lidar_2012'),
    source: wmtsLausanneSource('orthophotos_ortho_lidar_2012', {
      timestamps: [2012],
      format: 'png'
    })
  }))
  arrayWmts.push(new OlLayerTile({
    title: 'Orthophoto 2016',
    type: 'base',
    visible: (initialBaseLayer === 'orthophotos_ortho_lidar_2016'),
    source: wmtsLausanneSource('orthophotos_ortho_lidar_2016', {
      timestamps: [2016],
      format: 'png'
    })
  }))
  if (useInternalWmts) {
    arrayWmts.push(new OlLayerTile({
                                     title: 'Plan cadastral souterrain (gris)',
                                     type: 'base',
                                     visible: (initialBaseLayer === 'fonds_geo_conduites'),
                                     source: wmtsLausanneSource(
                                     'fonds_geo_conduites', {
                                       timestamps: [2018],
                                       format: 'png'
                                     })
                                   }))
  }
  arrayWmts.push(new OlLayerTile({
    title: 'Carte Nationale',
    type: 'base',
    visible: (initialBaseLayer === 'fonds_geo_carte_nationale_msgroup'),
    source: wmtsLausanneSource('fonds_geo_carte_nationale_msgroup', {
      timestamps: [2014],
      format: 'png'
    })
  }))
  return arrayWmts
}

/**
 * creates an OpenLayers View Object
 * @param {array} centerView : an array [x,y] representing initial initial center of the view
 * @param {number} zoomView : an integer from 1 to 12 representing the level of zoom
 * @returns {ol.View} : the OpenLayers View object
 */
export function getOlView (centerView = [537892.8, 152095.7], zoomView = 12) {
  return new OlView({
    projection: swissProjection,
    center: centerView,
    minZoom: 1,
    maxZoom: 10,
    extent: MAX_EXTENT_LIDAR,
    zoom: zoomView
  })
}

export function getOlMap (divMap,
                          olView,
                          baseLayer = 'fonds_geo_osm_bdcad_couleur',
                          geojsonData = null,
                          clickCallback = null,
                          useInternalWMTS = false
                          ) {
  log.t(`In getOlMap(${divMap}, .. baseLayer= ${baseLayer}, geojsonData`)
  let olMousePosition = new OlMousePosition({
    coordinateFormat: createStringXY(1),
    projection: 'EPSG:2181'
    /*
    className: 'map-mouse-position',
    target: document.getElementById('mousepos'),
    undefinedHTML: '&nbsp;'
    */
  })
  const arrLayers = initWmtsLayers(baseLayer, useInternalWMTS )
  
  let newVectorLayer = null;
  if (!isNullOrUndefined(geojsonData)) {
    log.l(`# will load GeoJSON Polygon Layer( geojsondata:${geojsonData.features.lenght}`, geojsonData)
    const vectorSource = getVectorSourceGeoJson(geojsonData, false)
    newVectorLayer = new OlLayerVector({
      title: 'ol_vector_layer_geojsondata',
      name: 'ol_vector_layer_geojsondata',
      source: vectorSource,
      style: getPolygonStyle,
    });
    log.l(`Layer Features : ${getNumberFeaturesInLayer(newVectorLayer)}`, newVectorLayer)
    arrLayers.push(newVectorLayer)
  }
  const myMap = new OlMap({
    target: divMap,
    loadTilesWhileAnimating: true,
    // projection: swissProjection,
    controls: defaultControls({
      attributionOptions: ({
        collapsible: false
      })
    }).extend([olMousePosition]),
    layers: arrLayers,
    view: olView
  });
  myMap.set('ol_vector_layer_geojsondata', newVectorLayer);
  return myMap;
  
}

function fetchStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return Promise.resolve(response);
  }
  return Promise.reject(new Error(response.statusText));
}

function getVectorSourceGeoJson(geoJsonData, removeInvalidFeatures= true) {
  log.t('## in getVectorSourceGeoJson ');
  const tempSource = new OlSourceVector({
    format: new OlFormatGeoJSON({
      defaultDataProjection: 'EPSG:21781',
      projection: 'EPSG:21781',
    }),
    features: (new OlFormatGeoJSON()).readFeatures(geoJsonData),
  });
  if (removeInvalidFeatures) {
    // filter out any invalid polygon
    let arrFeatures = tempSource.getFeatures();
    arrFeatures.forEach((feature) => {
      if (!isValidFeature(feature)) {
        log.w(
        `WARNING in getVectorSourceGeoJson removing INVALID feature :\n${dumpFeatureToString(
        feature)}`);
        tempSource.removeFeature(feature)
      }
    })
  }
  return tempSource;
}

function getPolygonStyle(
  feature,
  resolution,
  options = {
    fill_color: 'rgba(255, 0, 0, 0.8)',
    stroke_color: '#191aff',
    stroke_width: 3,
  },
) {
  log.t('## Entering getStyle with feature :', feature);
  log.l(`resolution : ${resolution}`);
  
  let props = null;
  let theStyle = null;
  if (!isNullOrUndefined(feature) && !isNullOrUndefined(feature.getProperties())) {
    props = feature.getProperties();
    const id = isNullOrUndefined(props.id) ? '#INCONNU#' : props.id;
    log.l(`id : ${id}`);
    theStyle = new OlStyle({
      fill: new OlFill({
        color: isNullOrUndefined(props.fill_color) ? options.fill_color : props.fill_color,
      }),
      stroke: new OlStroke({
        color: isNullOrUndefined(props.stroke_color) ? options.stroke_color : props.stroke_color,
        width: isNullOrUndefined(props.stroke_width) ? options.stroke_width : props.stroke_width,
      }),
      image: new OlCircle({
        radius: isNullOrUndefined(props.stroke_width) ? options.stroke_width : props.stroke_width,
        fill: new OlFill({
          color: isNullOrUndefined(props.fill_color) ? options.fill_color : props.fill_color,
        }),
      }),
    });
  } else {
    theStyle = new OlStyle({
      fill: new OlFill({
        color: options.fill_color, // 'rgba(255, 0, 0, 0.8)',
      }),
      stroke: new OlStroke({
        color: options.stroke_color, // '#191aff',
        width: options.stroke_width,
      }),
      image: new OlCircle({
        radius: 9,
        fill: new OlFill({
          color: '#ffcc33',
        }),
      }),
    });
  }
  return theStyle;
}


export function loadGeoJsonUrlPolygonLayer(olMap,
                                           geojsonUrl,
                                           loadCompleteCallback = null,
                                           layerName = 'ol_vector_layer_geojsonurl') {
  log.t(`# in loadGeoJsonUrlPolygonLayer creating Layer : ${geojsonUrl}`);
  fetch(geojsonUrl)
    .then(fetchStatus)
    .then(response => response.json())
    .then((json) => {
      log.t('# in loadGeoJSONPolygonLayer then((json) => : ', json);
      const vectorSource = getVectorSourceGeoJson(json);
      const newLayer = new OlLayerVector({
        name: layerName,
        title: layerName,
        source: vectorSource,
        style: getPolygonStyle,
      });
      log.l(`Layer Features : ${getNumberFeaturesInLayer(newLayer)}`, newLayer);
      olMap.addLayer(newLayer);
      const extent = newLayer.getSource().getExtent();
      olMap.getView().fit(extent, olMap.getSize());
      if (functionExist(loadCompleteCallback)) {
        loadCompleteCallback(newLayer);
      }
    })
    .catch((error) => {
      // maybe find a better way to send back this error to the client
      log.e(`loadGeoJSONPolygonLayer # FETCH REQUEST FAILED with url: ${geojsonUrl}`, error);
    });
}

export function addGeoJSONPolygonLayer (olMap, geojsonUrl, loadCompleteCallback) {
  log.t(`# in addGeoJSONPolygonLayer creating Layer : ${geojsonUrl}`)
  const vectorSource = new OlSourceVector({
    url: geojsonUrl,
    format: new OlFormatGeoJSON({
      defaultDataProjection: 'EPSG:21781',
      projection: 'EPSG:21781'
    })
  })
  /*
   https://openlayers.org/en/latest/examples/draw-and-modify-features.html
   https://openlayers.org/en/latest/examples/modify-features.html
   TODO use a property of the geojson query to display color
   or a style function  : http://openlayersbook.github.io/ch06-styling-vector-layers/example-07.html
   */
  const newLayer = new OlLayerVector({
    source: vectorSource,
    style: new OlStyle({
      fill: new OlFill({
        color: 'rgba(255, 0, 0, 0.8)'
      }),
      stroke: new OlStroke({
        color: '#ffcc33',
        width: 3
      }),
      image: new OlCircle({
        radius: 9,
        fill: new OlFill({
          color: '#ffcc33'
        })
      })
    })
  })
  let listenerKey = vectorSource.on('change', function (e) {
    if (vectorSource.getState() === 'ready') {
      // TODO maybe add "loading icon" and here where to hide it
      // retrieve extent of all features to zoom only when loading of the layer via Ajax XHR is complete
      let extent = newLayer.getSource().getExtent()
      if (DEV) {
        log.l(`# Finished Loading Layer : ${geojsonUrl}`, e)
      }
      olMap.getView().fit(extent, olMap.getSize())
      // and unregister the "change" listener
      olObservable.unByKey(listenerKey)
      if (functionExist(loadCompleteCallback)) {
        loadCompleteCallback(newLayer)
      }
    }
  })
  return newLayer
}

export function initNewFeaturesLayer (olMap, olFeatures) {
  const newFeaturesLayer = new OlLayerVector({
    name: 'ol_newFeaturesLayer',
    source: new OlSourceVector({features: olFeatures}),
    style: new OlStyle({
      fill: new OlFill({
        color: 'rgba(255, 0, 0, 0.3)'
      }),
      stroke: new OlStroke({
        color: '#ffee00',
        width: 5
      }),
      image: new OlCircle({
        radius: 10,
        fill: new OlFill({
          color: '#ff4f22'
        })
      })
    })
  })
  // newFeaturesLayer.setMap(olMap) // use this to have an overlay
  olMap.addLayer(newFeaturesLayer)
  return newFeaturesLayer
}

export function setCreateMode (olMap, olFeatures, arrInteractionsStore, baseCounter, endCreateCallback) {
  log.t(`# in setCreateMode baseCounter : ${baseCounter}`)
  const modify = new OlInteractionModify({
    features: olFeatures,
    // the SHIFT key must be pressed to delete vertices, so
    // that new vertices can be drawn at the same position
    // of existing vertices
    deleteCondition: function (event) {
      return shiftKeyOnly(event) &&
        singleClick(event)
    }
  })
  olMap.addInteraction(modify)
  arrInteractionsStore.push(modify)
  // var currentNumCoords = 0
  const draw = new OlInteractionDraw({
    features: olFeatures, // vectorSource.getFeatures(),
    type: 'Polygon' /** @type {ol.geom.GeometryType} */
  /*
    geometryFunction: function (coords, geom) {
      if (isNullOrUndefined(geom)) { geom = new OlPolygon(null) }
      if (!isNullOrUndefined(coords[0])) {
        let numCoords = coords[0].length
        if (numCoords > currentNumCoords) {
          currentNumCoords = numCoords
          if (numCoords > 3) {
            let tmpCoords = coords[0].slice(0)
            tmpCoords.push(coords[0][0])
            let flatCoords = tmpCoords.reduce((r, s) => r.push(s[0], s[1]) && r, [])
            // flatCoords = flatCoords.map((p) => p.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))))
            let bad = polygonSelfIntersect(flatCoords)
            // console.log(`%c IN setCreateMode geometryFunction callback :`, 'background: #F4D03F; color: #111', coords, geom, bad, flatCoords)
            if (bad) {
              console.log(`%c WARNING SELF_INTERSECT in setCreateMode geometryFunction callback `, 'background: #f00; color: #fff', coords, geom, flatCoords)
              this.removeLastPoint()
              // coords[0].pop() // on retire la derniere coord qui est pas ok
            } else {
              console.log(`%c in setCreateMode geometryFunction callback `, 'background: #0f0; color: #000', coords, geom, flatCoords)
            }
          }
        }
      }
      geom.setCoordinates(coords)
      return geom
    }
    */
  })
  let id = baseCounter
  draw.on('change', function (e) {
    log.t(`IN setCreateMode EVENT.change :`, e)
  })
  draw.on('change:active', function (e) {
    if (DEV) {
      console.log(`%c IN setCreateMode EVENT.change:active :`, 'background: #F4D03F; color: #111', e)
    }
  })
  draw.on('drawstart', function (e) {
    id +=1
    e.feature.setId(id)
    e.feature.setProperties({'id': id})
    if (DEV) {
      console.log(`%c IN setCreateMode EVENT.drawstart: baseCounter : ${baseCounter} \n ${dumpFeatureToString(e.feature)}`, 'background: #F4D03F; color: #111', e)
    }
  })
  draw.on('drawend', function (e) {
    //let multiPolygon = new OlMultiPolygon([])
    let currentFeature = e.feature // this is the feature fired the event
    currentFeature.setId(id)
    currentFeature.setProperties({'id': id})
    if (isValidFeature(currentFeature)){
      currentFeature.setProperties({'title': `POLYGONE [${id}] VALIDE`})
    } else {
      currentFeature.setProperties({'title': `POLYGONE [${id}] INVALIDE`})
    }
    log.t(`INSIDE setCreateMode event drawend currentFeature: ${dumpFeatureToString(currentFeature)}`)
    let currentPolygon = currentFeature.getGeometry()
    let exteriorRingCoords = currentPolygon.getLinearRing(0).getCoordinates()
      .map((p) => p.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))))
    currentPolygon.setCoordinates([exteriorRingCoords], 'XY')
    if (functionExist(endCreateCallback)) {
      endCreateCallback(currentFeature)
    }
  })
  olMap.addInteraction(draw)
  arrInteractionsStore.push(draw)
  return draw
} // end of setCreateMode

export function setModifyMode (olMap, olLayer2Edit, arrInteractionsStore, baseCounter, endModifyCallback ) {
  log.t(`# in setModifyMode baseCounter : ${baseCounter}`)
  
  let modifyStyles = [
    /* We are using two different styles for the polygons:
     *  - The first style is for the polygons themselves.
     *  - The second style is to draw the vertices of the polygons.
     *    In a custom `geometry` function the vertices of a polygon are
     *    returned as `MultiPoint` geometry, which will be used to render
     *    the style.
     */
    new OlStyle({
      stroke: new OlStroke({
        color: 'blue',
        width: 3
      }),
      fill: new OlFill({
        color: 'rgba(0, 0, 255, 0.1)'
      })
    }),
    new OlStyle({
      image: new OlCircle({
        radius: 7,
        fill: new OlFill({
          color: 'orange'
        })
      }),
      geometry: function (feature) {
        // return the coordinates of the first ring of the polygon
        var coordinates = feature.getGeometry().getCoordinates()[0]
        return new OlMultiPoint(coordinates)
      }
    })
  ]
  
  let select = new OlInteractionSelect({
    layers: [olLayer2Edit],
    wrapX: false,
    style: modifyStyles // overlayStyle
  })
  /*
    The modify interaction does not listen to geometry change events.
    Changing the feature coordinates will make the modify interaction
    unaware of the actual feature coordinates.
    A possible fix: Maintain a collection used by Modify, so we can reload
    the features manually. This collection will always contain the same
    features as the select interaction.
  */
  let selectSource = new OlCollection()
  select.on('select', function (evt) {
    evt.selected.forEach(function (feature) {
      selectSource.push(feature)
    })
    evt.deselected.forEach(function (feature) {
      selectSource.remove(feature)
    })
  })
  let modify = new OlInteractionModify({
    features: selectSource, // use our custom collection instead of select.getFeatures()
    // the SHIFT key must be pressed to delete vertices, so
    // that new vertices can be drawn at the same position
    // of existing vertices
    deleteCondition: function (event) {
      return shiftKeyOnly(event) &&
        singleClick(event)
    }
  })
  let originalCoordinates = {}
  modify.on('modifystart', function (evt) {
    evt.features.forEach(function (feature) {
      originalCoordinates[feature] = feature.getGeometry().getCoordinates()
    })
  })
  modify.on('modifyend', function (e) {
    let currentFeatures = e.features.getArray()
    log.t(`-->INSIDE setModifyMode event modifyend : `, e)
    let newPoint = e.mapBrowserEvent.coordinate // point of last click
    
    const formatWKT = new OlFormatWKT()
    currentFeatures.forEach(function (feature) {
      let isItValid = isValidPolygon(feature, newPoint)
      log.l(`--> in modifyend featureWKTGeometry=\n${dumpFeatureToString(feature)}`)
      if ((feature in originalCoordinates) && !isItValid) {
        feature.getGeometry().setCoordinates(originalCoordinates[feature])
        delete originalCoordinates[feature]
        // remove and re-add the feature to make Modify reload it's geometry
        selectSource.remove(feature)
        selectSource.push(feature)
      }
      const id = feature.getProperties()['id'] || 0;
      if (isValidFeature(feature)){
        feature.setProperties({'title': `POLYGONE [${id}] VALIDE`})
      } else {
        feature.setProperties({'title': `POLYGONE [${id}] INVALIDE`})
      }
      if (functionExist(endModifyCallback)) {
        endModifyCallback(feature)
      }
      let featureWKTGeometry = formatWKT.writeFeature(feature)
      log.l(`--> in modifyend featureWKTGeometry= ${featureWKTGeometry}`)
    })
    
  })
  olMap.addInteraction(select)
  olMap.addInteraction(modify)
  arrInteractionsStore.push(select)
  arrInteractionsStore.push(modify)
}

export function setTranslateMode (olMap, olLayer2Translate, arrInteractionsStore) {
  log.t(`# in setTranslateMode `)
  let select = new OlInteractionSelect({
    layers: [olLayer2Translate]
  })
  let translate = new OlInteractionTranslate({
    features: select.getFeatures()
  })
  olMap.addInteraction(select)
  olMap.addInteraction(translate)
  arrInteractionsStore.push(select)
  arrInteractionsStore.push(translate)
}

export function setDeleteMode (olMap, olLayer2Delete, arrInteractionsStore, baseCounter) {
  log.t(`# in setModifyMode baseCounter : ${baseCounter}`)
  let select = new OlInteractionSelect({
    layers: [olLayer2Delete]
  })
  let selectSource = new OlCollection()
  select.on('select', function (evt) {
    evt.selected.forEach(function (feature) {
      selectSource.push(feature)
      log.l(` Feature selected 4 delete ${dumpFeatureToString(feature)}`)
      olLayer2Delete.getSource().removeFeature(feature)
    })
    evt.deselected.forEach(function (feature) {
      selectSource.remove(feature)
    })
  })
  olMap.addInteraction(select)
  arrInteractionsStore.push(select)
}

export function findFeaturebyId (olLayer, idFieldName, id) {
  let source = olLayer.getSource()
  let arrFeatures = source.getFeatures()
  for (let i = 0; i < arrFeatures.length; i++) {
    if (arrFeatures[i].getProperties()[idFieldName] === id) {
      return arrFeatures[i]
    }
  }
  return null
}

export function getFeatureExtentbyId (olLayer, idFieldName, id) {
  let feature = this.findFeaturebyId(olLayer, idFieldName, id)
  if (feature != null) {
    return feature.getGeometry().getExtent()
  } else {
    return null
  }
}

export function getNumberFeaturesInLayer (olLayer) {
  if (isNullOrUndefined(olLayer)) {
    return 0
  } else {
    let source = olLayer.getSource()
    let arrFeatures = source.getFeatures()
    return arrFeatures.length
  }
}

export function getGeoJSONGeomFromFeature (olFeature) {
  const formatGeoJSON = new OlFormatGeoJSON()
  let geom = olFeature.getGeometry()
  let geometryType = geom.getType().toUpperCase()
  if (geometryType === 'POLYGON') {
    let exteriorRingCoords = geom.getLinearRing(0).getCoordinates()
      .map((p) => p.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))))
    geom.setCoordinates([exteriorRingCoords], 'XY')
  } else  {
    log.w(`WARNING IN ${MODULE_NAME}.getGeoJSONGeomFromFeature() : only POLYGON ARE SUPPORTED FOR NOW`)
  }
  return formatGeoJSON.writeFeature(olFeature)
}


export function getWktGeomFromFeature (olFeature) {
  log.t(`in getWktGeometryFeaturesInLayer `)
  const formatWKT = new OlFormatWKT()
  let geom = olFeature.getGeometry()
  let geometryType = geom.getType().toUpperCase()
  if (geometryType === 'POLYGON') {
    let exteriorRingCoords = geom.getLinearRing(0).getCoordinates()
      .map((p) => p.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))))
    geom.setCoordinates([exteriorRingCoords], 'XY')
  } else  {
    log.w(`WARNING IN ${MODULE_NAME}.getWktGeomFromFeature() : only POLYGON ARE SUPPORTED FOR NOW`)
  }
  return formatWKT.writeFeature(olFeature)
}

export function getWktGeometryFeaturesInLayer (olLayer) {
  if (isNullOrUndefined(olLayer)) {
    return null
  } else {
    log.t(`in getWktGeometryFeaturesInLayer `)
    let source = olLayer.getSource()
    let arrFeatures = source.getFeatures()
    log.l(`--> found ${arrFeatures.length} Features`)
    let strGeom = ''
    if (arrFeatures.length > 0) {
      for (let i = 0; i < arrFeatures.length; i++) {
        let featureString = dumpFeatureToString(arrFeatures[i])
        strGeom += featureString
      }
    }
    return strGeom
  }
}

export function isValidFeature (olFeature) {
  const geometryType = olFeature.getGeometry().getType().toUpperCase();
  let isValid = true;
  switch (geometryType) {
      case 'MULTIPOLYGON':
        isValid = isValidMultiPolygon(olFeature);
        break;
      case 'POLYGON':
        isValid = isValidPolygon(olFeature);
        break;
      default:
        log.w('## isValidFeature : only MULTIPOLYGON and POLYGON are supported for now')
    }
    return isValid;
}

/**
 * Allow to get a string representation of the feature
 * @param {ol.Feature} olFeature : the feature of geometry type Polygon you want to dump
 * @return {string} : the string representation of this feature
 */
export function dumpFeatureToString (olFeature) {
  log.t(`in dumpFeatureToString `);
  let featureWKTGeometry = getWktGeomFromFeature(olFeature);
  const geometryType = olFeature.getGeometry().getType().toUpperCase();
  const rev = olFeature.getRevision();
  const id = olFeature.getId();
  const feature_props = olFeature.getProperties();
  const isValid = isValidFeature(olFeature) ? 'VALID' : 'INVALID';
  let feature_props_dump = ''
  if (!isNullOrUndefined(feature_props)) {
    feature_props_dump = dumpObject2String(feature_props);
  }
  let featureString = `\n${isValid} ${geometryType} Feature id=${id}  : (rev ${rev})
  \n# PROPERTIES:\n${feature_props_dump}
  \n# WKT GEOMETRY:\n${featureWKTGeometry}\n`
  return featureString
}

export function getMultiPolygonWktGeometryFromPolygonFeaturesInLayer (olLayer, id = 0) {
  if (isNullOrUndefined(olLayer)) {
    return null
  } else {
    log.t(`--> getMultiPolygonWktGeometryFromFeaturesInLayer `)
    let source = olLayer.getSource()
    let arrFeatures = source.getFeatures()
    log.l(`--> found ${arrFeatures.length} Features`)
    let tmpMultiPolygon = new OlMultiPolygon([])
    if (arrFeatures.length > 0) {
      for (let i = 0; i < arrFeatures.length; i++) {
        let geom = arrFeatures[i].getGeometry()
        let geometryType = geom.getType().toUpperCase()
        if (geometryType === 'POLYGON') {
          let exteriorRingCoords = geom.getLinearRing(0).getCoordinates()
            .map((p) => p.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))))
          geom.setCoordinates([exteriorRingCoords], 'XY')
          tmpMultiPolygon.appendPolygon(geom)
        }
      }
      let multiPolygonFeature = new OlFeature({
        geometry: tmpMultiPolygon
      })
      multiPolygonFeature.setId(id)
      let featureWKTGeometry = getWktGeomFromFeature(multiPolygonFeature)
      if (DEV) {
        console.log(`%c WKT : ${featureWKTGeometry} `, 'background: #ffff00; color: #111')
      }
      return featureWKTGeometry
    }
  }
}

export function getBBFromWktPolygon (wktGeometry) {
  let BoundingBox = null
  const formatWKT = new OlFormatWKT()
  let feature = formatWKT.readFeature(wktGeometry, {
      dataProjection: 'EPSG:21781',
      featureProjection: 'EPSG:21781'
    })
    let geometry = feature.getGeometry()
  return geometry.getExtent()
}

export function addWktPolygonToLayer (olLayer, wktGeometry, baseCounter) {
  if (isNullOrUndefined(olLayer)) {
    return null
  } else {
    let id = baseCounter
    let source = olLayer.getSource()
    const formatWKT = new OlFormatWKT()
    let feature = formatWKT.readFeature(wktGeometry, {
      dataProjection: 'EPSG:21781',
      featureProjection: 'EPSG:21781'
    })
    let geometryType = feature.getGeometry().getType().toUpperCase()
    // TODO if layer contain already features check for identical features and do not add them twice
    switch (geometryType) {
      case 'MULTIPOLYGON':
        // let's add the polygons
        feature.getGeometry().getPolygons().forEach(function (polygon) {
          // console.log('## addWktPolygonToLayer found polygon :', polygon)
          let polygonFeature = new OlFeature({
            geometry: polygon
          })
          if (isValidPolygon(polygonFeature)) {
            // TODO call isPolygonsFeaturesEqual for all existing other polygon
            id += 1 // increment counter
            polygonFeature.setId(id)
            polygonFeature.setProperties({'id': id})
            polygonFeature.setProperties({'title': `POLYGONE [${id}] VALIDE`})
            source.addFeature(polygonFeature)
          } else {
            log.e('## Error in addWktPolygonToLayer : MULTIPOLYGON IS NOT VALID')
            log.e('## Error in addWktPolygonToLayer : invalid polygon is this one:',dumpFeatureToString(polygonFeature))
            return null
          }
        })
        break
      case 'POLYGON':
        if (isValidPolygon(feature)) {
          // let's use this one as it is
          id += 1 // increment counter
          feature.setId(id)
          feature.setProperties({'id': id})
          feature.setProperties({'title': `POLYGONE [${id}] VALIDE`})
          source.addFeature(feature)
        } else {
          log.e('## Error in addWktPolygonToLayer : POLYGON IS NOT VALID')
          log.e('## Error in addWktPolygonToLayer : invalid polygon is this one:',dumpFeatureToString(feature))
          return null
        }
        break
      default:
        log.e('## Error only MULTIPOLYGON and POLYGON are supported here')
        return null
    }
    return id
  }
}
// this function expects only the geometry part of the geojson
// TODO may be write a function that also can add a complete GeoJSON with attributes
export function addGeoJsonPolygonToLayer (olLayer, GeoJSONGeometry, baseCounter) {
  log.t('## IN addGeoJsonPolygonToLayer ', GeoJSONGeometry)
  if (isNullOrUndefined(olLayer)) {
    return null
  } else {
    let id = baseCounter
    let source = olLayer.getSource()
    const formatGeoJSON = new OlFormatGeoJSON()
    let feature = formatGeoJSON.readFeature(GeoJSONGeometry, {
      dataProjection: 'EPSG:21781',
      featureProjection: 'EPSG:21781'
    })
    let geometryType = feature.getGeometry().getType().toUpperCase()
    // TODO if layer contain already features check for identical features and do not add them twice
    switch (geometryType) {
      case 'MULTIPOLYGON':
        // let's add the polygons
        feature.getGeometry().getPolygons().forEach(function (polygon) {
          // console.log('## addWktPolygonToLayer found polygon :', polygon)
          let polygonFeature = new OlFeature({
            geometry: polygon
          })
          if (isValidPolygon(polygonFeature)) {
            id += 1 // increment counter
            polygonFeature.setId(id)
            polygonFeature.setProperties({'id': id})
            polygonFeature.setProperties({'title': `POLYGONE [${id}] VALIDE`})
            source.addFeature(polygonFeature)
          } else {
            log.e('## Error in addGeoJsonPolygonToLayer : MULTIPOLYGON IS NOT VALID')
            log.e('## Error in addGeoJsonPolygonToLayer : invalid polygon is this one:',dumpFeatureToString(polygonFeature))
            return null
          }
        })
        break
      case 'POLYGON':
        if (isValidPolygon(feature)) {
          // let's use this one as it is
          id += 1 // increment counter
          feature.setId(id)
          feature.setProperties({'id': id})
          feature.setProperties({'title': `POLYGONE [${id}] VALIDE`})
          source.addFeature(feature)
        } else {
          log.e('## Error in addWktPolygonToLayer : POLYGON IS NOT VALID')
          log.e('## Error in addWktPolygonToLayer : invalid polygon is this one:',dumpFeatureToString(feature))
          return null
        }
        break
      default:
        log.e('## Error only MULTIPOLYGON and POLYGON are supported here')
        return null
    }
    return id
  }
}

export function isPointDistanceOkForPolygon (p0, p1) {
  let distance = distance2Point(p0, p1)
  if (distance <= EPSILON) return true // comparing same point, probably start and end point
  if (distance > MIN_DISTANCE_BETWEEN_POINTS) return true
  return false
}

/**
 * Allow to check if an OpenLayers Polygon is valid:
 * 0) the feature is of type Polygon
 * 1) No point of the polygons are nearest then MIN_DISTANCE_BETWEEN_POINTS of another point of this polygon
 * 2) No self-intersection etc like topologically valid, according to the OGC SFS specification
 * 3) No point of the polygons are inside another polygon (NOT DONE IN THIS VERSION)
 * @param {ol.Feature} olFeature : the feature of geometry type Polygon you want to check
 * @param {array} clickPoint : 2d array with x,y coordinates of last point modified
 * @return {boolean} : true if the polygon is valid
 */
export function isValidPolygon (olFeature, clickPoint = null, removeDuplicates = true) {
  const debugThis = false;
  let geometry = olFeature.getGeometry()
  let geometryType = geometry.getType().toUpperCase()
  if (geometryType === 'POLYGON') {
    // let's check first condition 1 no point are nearest then tolerance
    // TODO try to do it without clickPoint
    let coordsPolygon = []
    let exteriorRingCoords = geometry.getLinearRing(0).getCoordinates()
      .map((p) => p.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION))))
    if (debugThis) log.l('## isValidPolygon : Polygon exteriorRingCoords', exteriorRingCoords)
    if (!isNullOrUndefined(clickPoint)) {
      let newCoord = clickPoint.map((v) => parseFloat(Number(v).toFixed(DIGITIZE_PRECISION)))
      if (debugThis) log.l('## isValidPolygon : newCoord', newCoord)
      for (let i = 0; i < exteriorRingCoords.length; i++) {
        let p = exteriorRingCoords[i]
        // let's store only distinct points to take into account fake points in create mode
        if (i === 0) {
          coordsPolygon.push(p[0], p[1])
        } else {
          if (distance2Point(p, exteriorRingCoords[(i - 1)]) >= EPSILON) {
            coordsPolygon.push(p[0], p[1])
          }
        }
        log.l(`Point ${i} [${p[0]},${p[1]}] = [${newCoord[0]},${newCoord[1]}] is ${pointsIsEqual(p, newCoord)}`)
        log.l(` distance is ${distance2Point(p, newCoord).toFixed(DIGITIZE_PRECISION)}`)
        if (isPointDistanceOkForPolygon(p, newCoord)) {
          if (debugThis) log.l('++++ POINT IS OKAY ++++')
        } else {
          if (debugThis) log.w('---- POINT NOT OKAY ---', newCoord)
          return false
        }
      }
    }
    // let's check condition 2
    let IntersectInfo = {result: false}
    if (coordsPolygon.length > 0) {
      if (debugThis) log.l('## isValidPolygon : Polygon purified Coords', coordsPolygon)
      IntersectInfo = polygonSelfIntersect(coordsPolygon)
    } else {
      IntersectInfo = polygonSelfIntersect(exteriorRingCoords.reduce((r, s) => r.push(s[0], s[1]) && r, []))
    }
    if (IntersectInfo.result) {
      log.e(`## isValidPolygon : THIS POLYGON IS NOT VALID reason : ${IntersectInfo.msg} at (${IntersectInfo.intersection[0]},${IntersectInfo.intersection[1]})`)
      return false
    }
    // let's implement the check condition 3 in some future because it depends on all other polygons

    return true
  } else {
    log.e('## isValidPolygon : only POLYGON features can be tested here')
    return false
  }
}

export function isValidMultiPolygon (olFeature) {
  const debugThis = false;
  let geometry = olFeature.getGeometry()
  let geometryType = geometry.getType().toUpperCase()
  let checkResultIsValid = true
  if (geometryType === 'MULTIPOLYGON') {
    geometry.getPolygons().forEach(function (polygon) {
      // console.log('## addWktPolygonToLayer found polygon :', polygon)
      let polygonFeature = new OlFeature({ geometry: polygon })
      if (isValidPolygon(polygonFeature)) {
        // TODO call isPolygonsFeaturesEqual for all existing other polygon
        
      } else {
        log.e('## Error in isValidMultiPolygon : MULTIPOLYGON IS NOT VALID')
        checkResultIsValid = false
        return false
      }
    })
    // if we are here all polygon ok
    return checkResultIsValid
    
  } else {
    log.e('## isValidMultiPolygon : only MULTIPOLYGON features can be tested here')
    return false
  }
}

export function isPolygonsFeaturesEqual (olFeature1, olFeature2) {
  let arrFeature1 = getArrVerticesPolygonFeature(olFeature1)
  let arrFeature2 = getArrVerticesPolygonFeature(olFeature2)
    for (let i = 0; i < arrFeature1.length; i++){
        log.l(`## isPolygonsFeaturesEqual ${i}: ${arrFeature1[i]}, ${arrFeature2[i]}`,arrFeature1[i], arrFeature2[i])
     if (isPointDistanceOkForPolygon(arrFeature1[i], arrFeature2[i])) {
       return false
     }
    }
    return true
}

export function getArrVerticesPolygonFeature (olFeature, removeDuplicates = true) {
  if (!isNullOrUndefined(olFeature)) {
    let geometry = olFeature.getGeometry()
    let geometryType = geometry.getType()
                               .toUpperCase()
    log.l(`## getArrVerticesPolygonFeature : geometryType is ${geometryType}`)
    if (geometryType === 'POLYGON') {
      let coordsPolygon = []
      let exteriorRingCoords = geometry.getLinearRing(0)
                                       .getCoordinates()
                                       .map((p) => p.map((v) => parseFloat(
                                       Number(v)
                                       .toFixed(DIGITIZE_PRECISION))))
      for (let i = 0; i < exteriorRingCoords.length; i++) {
        let p = exteriorRingCoords[i]
        // let's store only distinct points to take into account fake points in create mode
        if (i === 0) {
          coordsPolygon.push(p[0], p[1])
        } else {
          if (distance2Point(p, exteriorRingCoords[(i - 1)]) >= EPSILON) {
            coordsPolygon.push(p[0], p[1])
          }
        }
      }
      if (removeDuplicates) {
        return coordsPolygon
      } else {
        return exteriorRingCoords
      }
    } else {
      log.e('## getArrVerticesPolygonFeature : only POLYGON features can be tested here')
      return null
    }
  } else {
    log.e('## getArrVerticesPolygonFeature : olFeature was null or undefined')
    return null
  }
}

export function getNumVerticesPolygonFeature (olFeature, removeDuplicates = true) {
  let tmpArray = getArrVerticesPolygonFeature(olFeature, removeDuplicates)
  if (isNullOrUndefined(tmpArray)) {
    return null
  } else {
    return tmpArray.length
  }
}

export function flyTo(finalLocation, finalZoom, theOlView, done) {
        const duration = 2000;
        const zoom = theOlView.getZoom();
        let parts = 4;
        let called = false;
        function callback(complete) {
          --parts;
          if (called) {
            return;
          }
          if (parts === 0 || !complete) {
            called = true;
            done(complete);
          }
        }
        theOlView.animate({
          center: finalLocation,
          duration: duration
        }, callback);
        theOlView.animate({
          zoom: zoom - 4,
          duration: duration / 2
        }, {
          zoom: finalZoom,
          duration: duration / 2
        }, callback);
}
