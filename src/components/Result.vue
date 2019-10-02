<template>
  <div>
      <v-card :elevation="2" v-for="result in results" :key="result.scAddress" :id="result.scAddress">
        <v-card-title> {{ result.type }} </v-card-title>
        <v-card-text v-if="result.type === 'Smart Contract'" class="text--primary">
          The following smart contract can be further optimized to save:<br>
          Address: <b>{{ result.scAddress }}</b><br>
          Gas execution: <b>{{ result.gasExecution }}</b> Gas<br>
          Gas deployment: <b>{{ result.gasDeploy }}</b> Gas<br>
        </v-card-text>
        <v-card-text v-else class="text--primary">
          The account has no bytecode, therefore there is nothing to optimize.<br>
          Address: <b>{{ result.scAddress }}</b>
        </v-card-text>
      </v-card>
  </div>
</template>

<script>
export default {
  name: 'Result',
  computed: {
    results: function () {
      return this.$store.getters.results
    }
  }
}
</script>

<style scoped>
.v-card {
  margin-bottom: 20px
}
.v-card-title {
  font-size:10px
}
</style>
