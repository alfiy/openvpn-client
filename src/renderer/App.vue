<template>
  <div class="app">
    <header>
      <h1>OpenVPN Vue Client</h1>
      <div class="header-info">
        <div>状态: <b :class="statusClass">{{ statusText }}</b></div>
        <div v-if="authState.isLoggedIn" class="user-badge">
          {{ authState.user.username }}
        </div>
      </div>
    </header>
    
    <main v-if="authState.isLoggedIn">
      <aside>
        <Login />
        <div class="vpn-controls">
          <button @click="importConfig" :disabled="status === 'connecting'">
            导入 .ovpn 配置
          </button>
          <button @click="loadConfigs" :disabled="status === 'connecting'">
            刷新配置列表
          </button>
        </div>
        <ConfigList 
          :configs="configs" 
          :current-status="status"
          @start="startVPN" 
          @stop="stopVPN" 
        />
      </aside>
      
      <section>
        <LogPanel :logs="logs" />
        <div class="card">
          <h3>管理接口信息</h3>
          <pre class="mgmt-info">{{ mgmtInfo || '暂无管理信息' }}</pre>
        </div>
      </section>
    </main>
    
    <main v-else class="login-main">
      <div class="welcome-section">
        <h2>欢迎使用 OpenVPN 客户端</h2>
        <p>请先登录以使用 VPN 连接功能</p>
      </div>
      <Login />
    </main>
  </div>
</template>

<script setup>
// 导入Vue核心函数和子组件
import { ref, onMounted, computed } from 'vue'
import Login from '../components/Login.vue'
import ConfigList from '../components/ConfigList.vue'
import LogPanel from '../components/LogPanel.vue'
import { authState, checkAuthStatus } from '../stores/auth.js'

// 定义响应式数据
const configs = ref([])
const logs = ref([])
const status = ref('idle')
const mgmtInfo = ref('')

// 计算属性
const statusText = computed(() => {
  const statusMap = {
    'idle': '空闲',
    'connecting': '连接中',
    'connected': '已连接',
    'disconnected': '已断开',
    'reconnecting': '重连中'
  }
  return statusMap[status.value] || status.value
})

const statusClass = computed(() => {
  return {
    'status-idle': status.value === 'idle',
    'status-connecting': status.value === 'connecting',
    'status-connected': status.value === 'connected',
    'status-disconnected': status.value === 'disconnected'
  }
})

// 组件挂载后执行的初始化操作
onMounted(() => {
  // 检查登录状态
  checkAuthStatus()
  
  // 监听VPN日志事件
  window.electronAPI.onOvpnLog((msg) => {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] ${msg}`)
    
    // 当日志包含特定字符串时，更新状态为已连接
    if (msg.includes('Initialization Sequence Completed')) {
      status.value = 'connected'
    }
    
    // 限制日志数量，避免内存占用过多
    if (logs.value.length > 1000) {
      logs.value = logs.value.slice(-500)
    }
  })
  
  // 监听VPN进程退出事件
  window.electronAPI.onOvpnExit(() => {
    status.value = 'disconnected'
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] VPN连接已断开`)
  })

  // 监听管理接口信息
  window.electronAPI.onMgmt((msg) => {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] [MGMT] ${msg}`)
    mgmtInfo.value = msg
    
    // 解析状态信息并更新
    if (msg.includes('>STATE:')) {
      const parts = msg.split(',')
      if (parts.length > 1) {
        const st = parts[1].trim()
        status.value = st
      }
    }
  })
  
  // 如果已登录，初始加载配置文件列表
  if (authState.isLoggedIn) {
    loadConfigs()
  }
})

// 导入配置文件
async function importConfig() {
  if (!authState.isLoggedIn) {
    alert('请先登录')
    return
  }
  
  try {
    const res = await window.electronAPI.importConfig()
    if (!res.canceled) {
      await loadConfigs()
      const timestamp = new Date().toLocaleTimeString()
      logs.value.push(`[${timestamp}] 配置文件导入成功`)
    }
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] 配置文件导入失败: ${error.message}`)
  }
}

// 加载配置文件列表
async function loadConfigs() {
  if (!authState.isLoggedIn) return
  
  try {
    configs.value = await window.electronAPI.listConfigs()
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] 已加载 ${configs.value.length} 个配置文件`)
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] 加载配置文件失败: ${error.message}`)
  }
}

// 启动VPN连接
async function startVPN(config) {
  if (!authState.isLoggedIn) {
    alert('请先登录')
    return
  }
  
  if (status.value === 'connecting' || status.value === 'connected') {
    alert('VPN已在运行中')
    return
  }
  
  try {
    status.value = 'connecting'
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] 正在启动VPN连接: ${config.name}`)
    
    const result = await window.electronAPI.startOpenVPN({ configPath: config.path })
    
    if (!result.ok) {
      status.value = 'idle'
      logs.value.push(`[${timestamp}] VPN启动失败: ${result.msg || result.error}`)
    }
  } catch (error) {
    status.value = 'idle'
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] VPN启动异常: ${error.message}`)
  }
}

// 停止VPN连接
async function stopVPN() {
  if (!authState.isLoggedIn) return
  
  try {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] 正在停止VPN连接...`)
    
    await window.electronAPI.stopOpenVPN()
    status.value = 'disconnected'
  } catch (error) {
    const timestamp = new Date().toLocaleTimeString()
    logs.value.push(`[${timestamp}] 停止VPN失败: ${error.message}`)
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: #f5f5f5;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-badge {
  background: rgba(255,255,255,0.2);
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
}

.status-idle { color: #6c757d; }
.status-connecting { color: #ffc107; }
.status-connected { color: #28a745; }
.status-disconnected { color: #dc3545; }

main {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.login-main {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 2rem;
}

.welcome-section h2 {
  color: #333;
  margin-bottom: 0.5rem;
}

.welcome-section p {
  color: #666;
}

aside {
  flex: 0 0 350px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  border: 1px solid #e1e5e9;
}

.card h3 {
  margin-bottom: 1rem;
  color: #333;
  font-size: 1.1rem;
}

.vpn-controls {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.vpn-controls button {
  padding: 0.75rem;
  background: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}

.vpn-controls button:hover:not(:disabled) {
  background: #0056b3;
}

.vpn-controls button:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.mgmt-info {
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 4px;
  font-size: 0.85rem;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

@media (max-width: 768px) {
  main {
    flex-direction: column;
  }
  
  aside {
    flex: none;
  }
  
  header {
    padding: 1rem;
  }
  
  .header-info {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-end;
  }
}
</style>