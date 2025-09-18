// 用户认证状态管理
import { ref, reactive } from 'vue'

// 全局认证状态
export const authState = reactive({
  isLoggedIn: false,
  user: null,
  token: null,
  loginTime: null
})

// 用户数据存储 (实际项目中应该连接到后端API)
const users = [
  { id: 1, username: 'admin', password: 'admin123', email: 'admin@example.com', role: 'admin' },
  { id: 2, username: 'user1', password: 'user123', email: 'user1@example.com', role: 'user' },
  { id: 3, username: 'demo', password: 'demo', email: 'demo@example.com', role: 'user' }
]

// 登录功能
export async function login(username, password) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find(u => u.username === username && u.password === password)
      
      if (user) {
        const token = generateToken()
        const userData = { ...user }
        delete userData.password // 不返回密码
        
        authState.isLoggedIn = true
        authState.user = userData
        authState.token = token
        authState.loginTime = new Date().toISOString()
        
        // 保存到localStorage
        localStorage.setItem('auth_token', token)
        localStorage.setItem('auth_user', JSON.stringify(userData))
        localStorage.setItem('auth_login_time', authState.loginTime)
        
        resolve({ success: true, user: userData, token })
      } else {
        reject({ success: false, message: '用户名或密码错误' })
      }
    }, 500) // 模拟网络延迟
  })
}

// 登出功能
export function logout() {
  authState.isLoggedIn = false
  authState.user = null
  authState.token = null
  authState.loginTime = null
  
  // 清除localStorage
  localStorage.removeItem('auth_token')
  localStorage.removeItem('auth_user')
  localStorage.removeItem('auth_login_time')
}

// 检查登录状态
export function checkAuthStatus() {
  const token = localStorage.getItem('auth_token')
  const user = localStorage.getItem('auth_user')
  const loginTime = localStorage.getItem('auth_login_time')
  
  if (token && user && loginTime) {
    // 检查token是否过期 (24小时)
    const loginDate = new Date(loginTime)
    const now = new Date()
    const hoursDiff = (now - loginDate) / (1000 * 60 * 60)
    
    if (hoursDiff < 24) {
      authState.isLoggedIn = true
      authState.user = JSON.parse(user)
      authState.token = token
      authState.loginTime = loginTime
      return true
    } else {
      // token过期，清除数据
      logout()
    }
  }
  
  return false
}

// 生成简单的token (实际项目中应该使用JWT等)
function generateToken() {
  return 'token_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now()
}

// 验证token
export function validateToken(token) {
  return token && token.startsWith('token_')
}