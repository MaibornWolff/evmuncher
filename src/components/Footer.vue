<template>
  <v-footer>
      <v-layout>
          <v-flex xs5>
            <div v-if="web3Status">{{ web3Address }} - {{ web3Network }}</div>
            <div v-else>{{ web3Msg }}</div>
          </v-flex>
          <v-flex xs2>
            <div>Made with <v-icon small color="deep-purple">mdi-heart</v-icon> and <v-icon small color="deep-purple">mdi-auto-fix</v-icon> by DLT</div>
          </v-flex>
          <v-flex xs5>
            <div>
              <div class="float-right text-right">&copy; {{ new Date().getFullYear() }}</div>
            </div>
          </v-flex>
      </v-layout>
    </v-footer>
</template>

<script>
export default {
  name: 'Footer',
  computed: {
    web3Status: function () {
      return this.$store.getters.web3Connection.status
    },
    web3Msg: function () {
      return this.$store.getters.web3Connection.msg
    },
    web3Address: function () {
      return this.$store.getters.web3Connection.address
    },
    web3Network: function () {
      return this.$store.getters.web3Connection.network
    }
  }
}
</script>

<style scoped>
</style>
