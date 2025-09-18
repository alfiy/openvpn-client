<template>
  <div class="card">
    <h3>VPN 配置文件</h3>
    <div v-if="configs.length === 0" class="empty-state">
      <p>暂无配置文件</p>
      <small>请点击"导入 .ovpn 配置"添加配置文件</small>
    </div>
    <ul v-else class="config-list">
      <li v-for="config in configs" :key="config.path" class="config-item">
        <div class="config-info">
          <div class="config-name">{{ config.name }}</div>
          <div class="config-path">{{ formatPath(config.path) }}</div>
        </div>
        <div class="config-actions">
          <button 
            @click="$emit('start', config)"
            :disabled="isConnecting || isConnected"
            class="btn-start"
            :title="getStartButtonTitle()"
          >
            {{ isConnecting ? '连接中...' : '连接' }}
          </button>
          <button 
            @click="$emit('stop')"
            :disabled="!isConnected && !isConnecting"
            class="btn-stop"
            :title="getStopButtonTitle()"
          >
            断开
          </button>
        </div>
      </li>
    </ul>
    
    <div v-if="configs.length > 0" class="config-stats">
      <small>共 {{ configs.length }} 个配置文件</small>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({ 
  configs: Array,
  currentStatus: {
    type: String,
    default: 'idle'
  }
})

// 计算属性
const isConnecting = computed(() => props.currentStatus === 'connecting')
const isConnected = computed(() => props.currentStatus === 'connected')

// 格式化路径显示
function formatPath(path) {
  if (!path) return ''
  // 只显示文件名，隐藏完整路径
  const parts = path.split(/[/\\]/)
  return parts[parts.length - 1]
}

// 获取开始按钮提示文本
function getStartButtonTitle() {
  if (isConnecting.value) return '正在连接中，请稍候...'
  if (isConnected.value) return '已有连接处于活动状态'
  return '点击连接此VPN配置'
}

// 获取停止按钮提示文本
function getStopButtonTitle() {
  if (!isConnected.value && !isConnecting.value) return '当前无活动连接'
  return '断开当前VPN连接'
}
</script>

<style scoped>
.config-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.config-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  margin-bottom: 8px;
  background: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease;
}

.config-item:hover {
  background: #e9ecef;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.config-item:last-child {
  margin-bottom: 0;
}

.config-info {
  flex: 1;
  min-width: 0;
}

.config-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
  word-break: break-all;
}

.config-path {
  font-size: 12px;
  color: #666;
  opacity: 0.8;
}

.config-actions {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
}

.config-actions button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 60px;
}

.btn-start {
  background: #28a745;
  color: white;
}

.btn-start:hover:not(:disabled) {
  background: #218838;
  transform: translateY(-1px);
}

.btn-start:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.btn-stop {
  background: #dc3545;
  color: white;
}

.btn-stop:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-stop:disabled {
  background: #6c757d;
  cursor: not-allowed;
  transform: none;
}

.empty-state {
  text-align: center;
  padding: 2rem 1rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.empty-state small {
  color: #999;
}

.config-stats {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
  text-align: center;
  color: #666;
}
</style>