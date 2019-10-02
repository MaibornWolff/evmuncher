<template>
  <v-app>
   <v-app-bar v-if="devconStyle" app class="devcon-color">
      <!--<v-toolbar-title class="headline text-uppercase">
        <span>EVMuncher</span>
      </v-toolbar-title>
      <div class="flex-grow-1"></div>-->
      <v-toolbar-items>
        <a href="https://www.maibornwolff.de/en" style="height: inherit;">
          <img :src="image_src" style="height: inherit; padding: 5px">
        </a>
      </v-toolbar-items>
    </v-app-bar>

    <v-app-bar v-else app style="background: #459c9d">
      <v-toolbar-items>
        <a href="https://www.maibornwolff.de/en" style="height: inherit;">
          <img :src="image_src" style="height: inherit; padding: 5px">
        </a>
      </v-toolbar-items>
    </v-app-bar>

    <v-content v-bind:class="{ yellowish: devconStyle, white: !devconStyle }">
      <v-container align-content-center>
        <v-row>
          <v-flex xs5 offset-xs3>
            <AddressInput></AddressInput>
          </v-flex>
        </v-row>
        <v-row>
          <v-flex xs3 offset-xs4>
            <Result v-if="resultVisibility"></Result>
            <Information v-else></Information>
          </v-flex>
        </v-row>
      </v-container>
    </v-content>
    <Footer v-if="devconStyle" class="devcon-color"></Footer>
    <Footer v-else style="background: #459c9d"></Footer>
  </v-app>
</template>

<script>
import { store } from './store'
import AddressInput from './components/AddressInput'
import Result from './components/Result'
import Footer from './components/Footer'
import Information from './components/Information'

export default {
  name: 'App',
  data: function () {
    return {
      image_src: require('../public/mensch_ti.png')
    }
  },
  components: {
    AddressInput,
    Result,
    Footer,
    Information
  },
  computed: {
    resultVisibility: function () {
      return this.$store.getters.visibility
    },
    devconStyle: function () {
      return this.$store.getters.devconStyle
    }
  },
  store
}
</script>

<style>
.devcon-color {
  background: linear-gradient(90deg, #fca09a, #fcccd3, #ffcc9d, #98ddad, #81d7ec, #a0aaed)
}

.mw-color {
  background: #459c9d
}

.yellowish {
  background: #FFFFF7
}

.white {
  background: #FFFFFF
}
</style>
