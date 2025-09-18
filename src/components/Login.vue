<template>
  <div class="card">
    <h3>Login</h3>

    <div v-if="user">
      <div>已登录：<b>{{ user.displayName || user.username }}</b></div>
      <button @click="logout">Logout</button>
    </div>

    <div v-else>
      <input v-model="username" placeholder="Username" />
      <input v-model="password" type="password" placeholder="Password" />
      <div style="margin-top:8px">
        <button @click="login" :disabled="busy">{{ busy ? 'Logging...' : 'Login' }}</button>
      </div>
      <div v-if="error" style="color:red;margin-top:6px">{{ error }}</div>
      <div style="margin-top:8px;color:#666">Demo user: <b>demo</b> / <b>password</b></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
const username = ref('')
const password = ref('')
const busy = ref(false)
const error = ref('')
const user = ref(null)

// API base (auth server started inside electron main): adjust port if you changed it
const API_BASE = 'http://localhost:34987'

function saveToken(token) {
  try {
    localStorage.setItem('auth_token', token)
  } catch (e) {
    console.warn('localStorage set failed', e)
  }
}

function clearToken() {
  try {
    localStorage.removeItem('auth_token')
  } catch (e) {}
}

async function login() {
  busy.value = true
  error.value = ''
  try {
    const res = await fetch(`${API_BASE}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: username.value, password: password.value })
    })
    const data = await res.json()
    if (!res.ok) {
      error.value = data.error || 'login failed'
      busy.value = false
      return
    }
    if (data.token) {
      saveToken(data.token)
      user.value = data.user
      // 通知父组件（例如 App.vue）发生了登录
      emitLogin(data.user)
    }
  } catch (e) {
    error.value = e.message || 'network error'
  } finally {
    busy.value = false
  }
}

function logout() {
  clearToken()
  user.value = null
  emitLogout()
}

function emitLogin(u) {
  // emit event to parent
  const ev = new CustomEvent('login-success', { detail: u })
  window.dispatchEvent(ev)
}

function emitLogout() {
  const ev = new CustomEvent('logout', {})
  window.dispatchEvent(ev)
}

onMounted(async () => {
  // 如果已有 token，尝试获取 /api/me
  try {
    const token = localStorage.getItem('auth_token')
    if (token) {
      const r = await fetch(`${API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (r.ok) {
        const d = await r.json()
        user.value = d.user
        emitLogin(d.user)
      } else {
        clearToken()
      }
    }
  } catch (e) {
    // ignore
  }
})
</script>

<style scoped>
input { display:block; margin:6px 0; padding:6px; width:100%; box-sizing:border-box }
button { padding:6px 10px }
</style>