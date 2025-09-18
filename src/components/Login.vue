<template>
  <div class="card">
    <h3>Login (Demo only)</h3>
    <input v-model="username" placeholder="Username" />
    <input v-model="password" type="password" placeholder="Password" />
    <button @click="save">Save</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
const username = ref('')
const password = ref('')
function save() {
  alert(`Saved locally: ${username.value}`)
}
</script>
