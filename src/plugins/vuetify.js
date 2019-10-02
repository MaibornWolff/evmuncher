import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

export default new Vuetify({
  icons: {
    iconfont: 'mdi'
  },
  theme: {
    'primary': '#009688',
    'secondary': '#009688',
    'accent': '#8bc34a',
    'error': '#FF5252',
    'info': '#2196F3',
    'success': '#4CAF50',
    'warning': '#FB8C00'
  }
})
