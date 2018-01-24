# cgil-vue-olmap

> VueJs component allows to display an interactive map of Lausanne in Switzerland with one tag !  

The original purpose of this component is to be used in Goeland.

It uses OpenLayers and WMTS Tiles from SGLEA Lausanne as base layers.
At runtime the user can choose between any of four base layers.

Depending on the attributes you set to this component you can :

1. fix the initial 'zoom' level (default: 13)
2. fix the initial postion 'center' an Array [x,y] (default: () => (positionGareLausanne)
3. activate the Polygon Creation/Edition Toolbar with 'editGeomEnabled' a Boolean (default: false)
4. Pass an initial valid WKT Polygon or Multi Polygon Geometry to display in 'geomWkt'

You can check the [online example demo](https://map.gil.town/)

![alt text](https://raw.githubusercontent.com/lao-tseu-is-alive/cgil-vue-olmap/master/examples/cgil-vue-olmap-Screenshot.png "ScreenShot of demo page")

## Getting Started

Install `cgil-vue-olmap` in the shell

```bash
npm install cgil-vue-olmap --save
```

Then import the vue component and use it in your code !

here is an example of code to test this in vue:

```html
<style lang="scss">
  .mymaps-container{
    display: flex;
    width: 100%;
    background-color: #1b6d85;
    text-align: center;
  }

  .mymaps-element{
    margin: auto;
    padding: 10px;
    float: left;
    width: 45%;
    height: 550px;
    border: 1px solid black;
  }
</style>

<template>
  <div>
  <h1>{{msg}}</h1>
  <div class="mymaps-container">
    <div class="mymaps-element">
      <cgil-ol-map id="map1"
                              :geom-wkt="mygeom1"
                              :edit-geom-enabled="true"
                              v-on:gomapSaveGeomClick="saveGeometry1">
      </cgil-ol-map>
      <textarea id="txtgeom1" rows="8" cols="60" v-model="mygeom1"></textarea>
      <p>Saved geometry :</p>
      <textarea id="loggeom1" rows="8" cols="60" ></textarea>
    </div>
    <div class="mymaps-element">
      <cgil-ol-map id="map2"
                              :geom-wkt="mygeom2"
                              v-on:gomapSaveGeomClick="saveGeometry2">
      </cgil-ol-map>
      <textarea id="txtgeom2" rows="8" cols="60" v-model="mygeom2"></textarea>
      <p>Saved geometry</p>
      <textarea id="loggeom2" rows="8" cols="60" ></textarea>
    </div>
  </div>
  </div>
</template>

<script>
  import cgilOlMap from './cgil-vue-olmap/src/cgil-vue-olmap'
  export default {
    name: 'testvue2MapOlSwiss21781',
    components: {cgilOlMap},
    data () {
      return {
        msg: 'Testing 2 vue2MapOlSwiss21781 Maps side by side',
        mygeom1: null,
        mygeom2: `MULTIPOLYGON(
        ((537884.03 152099.71,537883.73 152088.79,537891.14 152087.34,537892.39 152098.71,537884.03 152099.71)),
        ((537893.10 152094.40,537892.40 152087.44,537896.56 152087.04,537893.10 152094.40))
        )`
      }
    },
    methods: {
      saveGeometry1: function (val) {
        console.info('In PARENT TEST VUE2-MAP 1  event gomapSaveGeomClick received : ', val)
        let logtxt = document.getElementById('loggeom1')
        logtxt.innerText = val
      },
      saveGeometry2: function (val) {
        console.info('In PARENT TEST VUE2-MAP 2 event gomapSaveGeomClick received : ', val)
        let logtxt = document.getElementById('loggeom2')
        logtxt.innerText = val
      }
    }
  }
</script>
```



   

## Build Setup

``` bash
# clone this repository
git clone 

``` bash
# install dependencies
npm install

# serve with hot reload at http://localhost:4000
npm start

# build library for production with minification in dist folder
npm run build

```

