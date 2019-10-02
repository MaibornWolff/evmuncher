import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

export const store = new Vuex.Store({
  state: {
    visibility: false,
    web3Connection: false,
    checkedSCAddresses: [],
    results: [],
    devconStyle: false
  },
  mutations: {
    change: function (state, visibility) {
      state.visibility = visibility
    },
    changeWeb3Connection: function (state, web3Connection) {
      state.web3Connection = web3Connection
    },
    pushResult: function (state, result) {
      state.results.push(result)
    },
    pushSCAddress: function (state, address) {
      state.checkedSCAddresses.push(address)
    }
  },
  getters: {
    visibility: state => state.visibility,
    web3Connection: state => state.web3Connection,
    results: state => state.results,
    checkedSCAddresses: state => state.checkedSCAddresses,
    devconStyle: state => state.devconStyle
  }
})
