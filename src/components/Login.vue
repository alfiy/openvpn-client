<template>
  <div class="login-container">
    <div class="card login-card">
      <div v-if="!authState.isLoggedIn" class="login-form">
        <h3>用户登录</h3>
        
        <div class="form-group">
          <label for="username">用户名:</label>
          <input 
            id="username"
            v-model="loginForm.username" 
            type="text"
            placeholder="请输入用户名" 
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <div class="form-group">
          <label for="password">密码:</label>
          <input 
            id="password"
            v-model="loginForm.password" 
            type="password" 
            placeholder="请输入密码"
            :disabled="isLoading"
            @keyup.enter="handleLogin"
          />
        </div>
        
        <div v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>
        
        <button 
          @click="handleLogin" 
          :disabled="isLoading || !isFormValid"
          class="login-btn"
        >
          {{ isLoading ? '登录中...' : '登录' }}
        </button>
        
        <div class="demo-accounts">
          <h4>演示账户:</h4>
          <div class="demo-list">
            <div class="demo-item" @click="fillDemoAccount('admin', 'admin123')">
              <strong>管理员:</strong> admin / admin123
            </div>
            <div class="demo-item" @click="fillDemoAccount('user1', 'user123')">
              <strong>用户:</strong> user1 / user123
            </div>
            <div class="demo-item" @click="fillDemoAccount('demo', 'demo')">
              <strong>演示:</strong> demo / demo
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="user-info">
        <h3>欢迎回来!</h3>
        <div class="user-details">
          <div class="avatar">
            {{ authState.user.username.charAt(0).toUpperCase() }}
          </div>
          <div class="details">
            <div class="username">{{ authState.user.username }}</div>
            <div class="email">{{ authState.user.email }}</div>
            <div class="role">角色: {{ authState.user.role === 'admin' ? '管理员' : '用户' }}</div>
            <div class="login-time">
              登录时间: {{ formatLoginTime(authState.loginTime) }}
            </div>
          </div>
        </div>
        
        <button @click="handleLogout" class="logout-btn">
          退出登录
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { authState, login, logout, checkAuthStatus } from '../stores/auth.js'

// 登录表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

// 组件状态
const isLoading = ref(false)
const errorMessage = ref('')

// 计算属性
const isFormValid = computed(() => {
  return loginForm.username.trim() && loginForm.password.trim()
})

// 组件挂载时检查登录状态
onMounted(() => {
  checkAuthStatus()
})

// 处理登录
async function handleLogin() {
  if (!isFormValid.value || isLoading.value) return
  
  isLoading.value = true
  errorMessage.value = ''
  
  try {
    await login(loginForm.username.trim(), loginForm.password)
    // 登录成功，清空表单
    loginForm.username = ''
    loginForm.password = ''
  } catch (error) {
    errorMessage.value = error.message || '登录失败，请重试'
  } finally {
    isLoading.value = false
  }
}

// 处理登出
function handleLogout() {
  logout()
}

// 填充演示账户
function fillDemoAccount(username, password) {
  loginForm.username = username
  loginForm.password = password
}

// 格式化登录时间
function formatLoginTime(timeString) {
  if (!timeString) return ''
  const date = new Date(timeString)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.login-container {
  width: 100%;
}

.login-card {
  max-width: 350px;
  margin: 0 auto;
}

.login-form {
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
  color: #333;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.form-group input:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-bottom: 15px;
  padding: 8px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.login-btn {
  width: 100%;
  padding: 12px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.login-btn:hover:not(:disabled) {
  background-color: #0056b3;
}

.login-btn:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.demo-accounts {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.demo-accounts h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.demo-list {
  font-size: 12px;
}

.demo-item {
  padding: 5px 8px;
  margin: 2px 0;
  background-color: #f8f9fa;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.demo-item:hover {
  background-color: #e9ecef;
}

.user-info {
  padding: 20px;
  text-align: center;
}

.user-details {
  display: flex;
  align-items: center;
  margin: 20px 0;
  text-align: left;
}

.avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background-color: #007bff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  font-weight: bold;
  margin-right: 15px;
}

.details {
  flex: 1;
}

.username {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.email {
  color: #666;
  font-size: 14px;
  margin-bottom: 3px;
}

.role {
  color: #28a745;
  font-size: 14px;
  margin-bottom: 3px;
}

.login-time {
  color: #999;
  font-size: 12px;
}

.logout-btn {
  padding: 10px 20px;
  background-color: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.logout-btn:hover {
  background-color: #c82333;
}
</style>