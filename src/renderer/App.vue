<template>
  <div class="app">
    <header>
      <h1>OpenVPN Vue Client</h1>
      <div>Status: <b>{{ status }}</b></div>
    </header>
    <main>
      <aside>
        <Login />
        <button @click="importConfig">Import .ovpn</button>
        <button @click="loadConfigs">Refresh</button>
        <ConfigList :configs="configs" @start="startVPN" @stop="stopVPN" />
      </aside>
      <section>
        <LogPanel :logs="logs" />
        <div class="card">
          <h3>Management Info</h3>
          <pre>{{ mgmtInfo }}</pre>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
// 导入Vue核心函数和子组件
import { ref, onMounted } from 'vue'
import Login from '../components/Login.vue'
import ConfigList from '../components/ConfigList.vue'
import LogPanel from '../components/LogPanel.vue'

// 定义响应式数据
const configs = ref([])
const logs = ref([])
const status = ref('idle')
const mgmtInfo = ref('')

// 组件挂载后执行的初始化操作
onMounted(() => {
    // 监听VPN日志事件
  window.electronAPI.onOvpnLog((msg) => {
    logs.value.push(`[LOG] ${msg}`)
    // 当日志包含特定字符串时，更新状态为已连接
    if (msg.includes('Initialization Sequence Completed')) status.value = 'connected'
  })
  // 监听VPN进程退出事件
  window.electronAPI.onOvpnExit(() => status.value = 'disconnected')

  // 监听管理接口信息
  window.electronAPI.onMgmt((msg) => {
    logs.value.push(`[MGMT] ${msg}`)
    mgmtInfo.value = msg
    // 解析状态信息并更新
    if (msg.includes('>STATE:')) {
      const st = msg.split(',')[1]
      status.value = st
    }
  })
  // 初始加载配置文件列表
  loadConfigs()
})

// 初始加载配置文件列表
async function importConfig() {
  const res = await window.electronAPI.importConfig()
  if (!res.canceled) loadConfigs()      // 如果用户未取消，则刷新配置列表
}

// 加载配置文件列表
async function loadConfigs() {
  configs.value = await window.electronAPI.listConfigs()
}

// 启动VPN连接
async function startVPN(c) {
  status.value = 'connecting'
  await window.electronAPI.startOpenVPN({ configPath: c.path })
}

// 停止VPN连接
async function stopVPN() {
  await window.electronAPI.stopOpenVPN()
}
</script>
