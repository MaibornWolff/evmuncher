<template>
    <v-layout>
      <v-flex xs9 offset-xs1>
        <v-text-field
          id="scAddress"
          prepend-icon="mdi-ethereum"
          label="Smart Contract Address 0x.."
          color="success"
          :rules="[isAddress]"
          @keyup.enter="output"
          clearable
        ></v-text-field>
      </v-flex>
      <v-flex xs1>
        <v-btn v-if="devconStyle" @click="output" style="background: linear-gradient(90deg, #fca09a, #fcccd3, #ffcc9d, #98ddad, #81d7ec, #a0aaed)">Go</v-btn>
        <v-btn v-else @click="output" style="background: #459c9d">Go</v-btn>
      </v-flex>
    </v-layout>
</template>

<script>
import { store } from '../store'
import { ethMain } from '../logic/eth_interface'
import { w3Component } from '../logic/web3Component'

let r = w3Component.initW3()
console.log(r)
// store.commit('changeWeb3Connection', w3Component.initW3())
store.commit('changeWeb3Connection', r)
w3Component.observer()

export default {
  name: 'AddressInput',
  computed: {
    devconStyle: function () {
      return this.$store.getters.devconStyle
    }
  },
  methods: {
    output: function () {
      let scAddress = document.getElementById('scAddress').value
      // remove elevation in case there is one
      let elem = document.getElementsByClassName('elevation-12')
      if (elem.length > 0) {
        elem[0].classList.replace('elevation-12', 'elevation-2')
      }
      // check if we maybe have a card like this already
      if (!(this.$store.getters.checkedSCAddresses.includes(scAddress))) {
        w3Component.getCodeByAddress(scAddress)
          .then(code => {
            let result = {}
            if (code === '0x') {
              result['type'] = 'Account'
            } else {
              result['type'] = 'Smart Contract'
              Object.assign(result, ethMain(code))
            }
            result['scAddress'] = scAddress
            this.$store.commit('pushSCAddress', scAddress)
            this.$store.commit('change', true)
            this.$store.commit('pushResult', result)
          })
      } else {
        // highlight the card with the sc address
        document.getElementById(scAddress).classList.replace('elevation-2', 'elevation-12')
      }
    },
    isAddress: function (address) {
      if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
        // check if it has the basic requirements of an address
        return 'Invalid smart contract address'
      } else if (
        /^(0x)?[0-9a-f]{40}$/.test(address) ||
        /^(0x)?[0-9A-F]{40}$/.test(address)
      ) {
        // If it's all small caps or all all caps, return true
        return true
      } else {
        // Otherwise check each case
        // isChecksumAddress(address);
        return true
      }
    }
  }
}
</script>

<style scoped>
.v-btn {
  min-width: 0;
  margin: 16px 0px 0px 8px;
}
</style>
