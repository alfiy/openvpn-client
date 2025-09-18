<template>
  <div class="card log">
    <h3>Logs</h3>
    <div class="log-area">
      <div v-for="(l,i) in logs" :key="i">{{ l }}</div>
    </div>
  </div>
</template>

<script setup>
defineProps({ logs: Array })
</script>

<style scoped>
.log-area {
  background: #0b1220;
  color: #e6eef8;
  padding: 8px;
  height: 300px;
  overflow: auto;
  font-family: monospace;
}
</style>
