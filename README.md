# cgil-vue-olmap

> this VueJs component allows to display an interactive map of Lausanne in Switzerland with one tag !  

The original purpose of this component is to be used in Goeland.

It uses OpenLayers and WMTS Tiles from SGLEA Lausanne as base layers.
At runtime the user can choose between any of four base layers.

Depending on the attributes you set to this component you can :

1. fix the initial 'zoom' level (default: 13)
2. fix the initial postion 'center' an Array [x,y] (default: () => (positionGareLausanne)
3. activate the Polygon Creation/Edition Toolbar with 'editGeomEnabled' a Boolean (default: false)
4. Pass an initial valid WKT Polygon or Multi Polygon Geometry to display in 'geomWkt'

The npm bundle in is compiled with [POI](https://poi.js.org/) in CommonJS2 so that you can use it in another build tool, the bundle DOES NOT INCLUDE all modules in node_modules folder. 
This is done to avoid duplication of node_modules  when you build your own bundle.

> THIS IS NOT AN UMD JS BUNDLE ! so... YOU CANNOT USE IT 'AS IS' IN YOUR BROWSER

As soon as I got time for this i will try to prepare an UMD build with POI or Bili.
Feel free to check out the code from github and try to do it yourself if you need an "huge" UMD bundle.

You can check the [online example demo](https://map.gil.town/)

![alt text](https://raw.githubusercontent.com/lao-tseu-is-alive/cgil-vue-olmap/master/examples/cgil-vue-olmap-Screenshot.png "ScreenShot of demo page")

## Getting Started

you can start a new vue test project with vue-cli like this
```bash
vue init webpack
```
answer the questions then install `cgil-vue-olmap` and the element-ui dependency from the shell

```bash
npm install cgil-vue-olmap element-ui --save
npm run dev 
```

>edit  the src/App.vue like this :
```html
<template>
  <div id="app">
      <cgil-ol-map :edit-geom-enabled="true"></cgil-ol-map> 
  </div>
</template>

<script>
import 'cgil-vue-olmap/dist/cgil-vue-olmap.css'
import cgilOlMap from 'cgil-vue-olmap'

export default {
  name: 'App',
  components: {  cgilOlMap  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 0px;
}
</style>

```
>edit  the src/main.js like this :
```javascript

// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/index.css'
import App from './App.vue'
Vue.use(ElementUI)

Vue.config.productionTip = false

/* eslint-disable no-new */
new Vue({
  el: '#app',
  components: { App },
  template: '<App/>'
})

```





here is another example of code with two instance of the component in vue:

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
  import 'cgil-vue-olmap/dist/cgil-vue-olmap.css'
  import cgilOlMap from 'cgil-vue-olmap'
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

