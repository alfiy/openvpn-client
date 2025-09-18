<template>
  <div class="card">
    <h3>Configs</h3>
    <ul>
      <li v-for="c in configs" :key="c.path">
        {{ c.name }}
        <button @click="$emit('start', c)">Start</button>
        <button @click="$emit('stop')">Stop</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
defineProps({ configs: Array })
</script>
