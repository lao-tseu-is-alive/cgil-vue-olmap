import Vue from "vue";
import demoCgilOlMap from './demoApp'
import ElementUI from 'element-ui'
import 'element-ui/lib/theme-chalk/display.css';
// import './element-variables.scss'
import 'element-ui/lib/theme-chalk/index.css'
Vue.use(ElementUI)

new Vue({
  el: "#app",
  render: h => h(demoCgilOlMap)
});