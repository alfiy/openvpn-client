const { app, BrowserWindow, ipcMain, dialog } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')
const net = require('net')

//  全局变量与初始化
let mainWindow
let openvpnProcess = null
let mgmtClient = null
let mgmtPort = 7505 // 默认端口
const userDataDir = app.getPath('userData')
const configsDir = path.join(userDataDir, 'ovpn_configs')
// 确保配置目录存在
if (!fs.existsSync(configsDir)) fs.mkdirSync(configsDir, { recursive: true })

// 窗口创建
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // 预加载脚本
      contextIsolation: true    // 启用上下文隔离，增强安全性
    }
  })

  // 根据是否打包，加载不同的页面
  if (app.isPackaged) {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  } else {
    const devServerUrl = 'http://localhost:5173';
    
    // 添加重试机制以解决Vite和Electron的竞态条件问题
    const loadDevUrl = async () => {
      try {
        await mainWindow.loadURL(devServerUrl);
      } catch (err) {
        console.log('Failed to load dev server URL, retrying...');
        setTimeout(loadDevUrl, 1000); // 1秒后重试
      }
    };
    
    loadDevUrl();
    
    // 可选：打开开发者工具
    // mainWindow.webContents.openDevTools();
  }
}

// 应用就绪后创建窗口
app.whenReady().then(createWindow)

// 所有窗口关闭时退出应用(除了macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// 导入 VPN 配置文件
ipcMain.handle('import-config', async () => {
    // 显示文件选择对话框
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'OpenVPN config', extensions: ['ovpn', 'conf'] }]
  })
  if (canceled) return { canceled: true }

  // 复制选中的配置文件到应用配置目录
  const results = []
  for (const fp of filePaths) {
    const dest = path.join(configsDir, path.basename(fp))
    fs.copyFileSync(fp, dest)
    results.push({ name: path.basename(fp), path: dest })
  }
  return { canceled: false, files: results }
})

// 列出所有导入的配置文件
ipcMain.handle('list-configs', async () => {
  return fs.readdirSync(configsDir).map(f => ({ name: f, path: path.join(configsDir, f) }))
})

// 启动 OpenVPN 连接
ipcMain.handle('start-openvpn', async (e, { configPath, openvpnPath = 'openvpn' }) => {
  if (openvpnProcess) return { ok: false, msg: 'already running' }
  try {
    // 启动 OpenVPN 连接
    openvpnProcess = spawn(openvpnPath, [
      '--config', configPath,   // 指定配置文件
      '--management', '127.0.0.1', String(mgmtPort),    // 启用管理接口
      '--management-hold',
      '--management-query-passwords',
      '--management-log-cache', '1000'
    ])

    // 转发OpenVPN输出到渲染进程
    openvpnProcess.stdout.on('data', d => {
      mainWindow.webContents.send('ovpn-log', d.toString('utf8'))
    })
    openvpnProcess.stderr.on('data', d => {
      mainWindow.webContents.send('ovpn-log', d.toString('utf8'))
    })
    // 处理进程退出
    openvpnProcess.on('exit', (c, s) => {
      mainWindow.webContents.send('ovpn-exit', { c, s })
      openvpnProcess = null
      if (mgmtClient) { mgmtClient.destroy(); mgmtClient = null }
    })

    // 连接 management socket
    setTimeout(connectMgmt, 1000)

    return { ok: true }
  } catch (e) {
    return { ok: false, error: e.message }
  }
})

// 停止 OpenVPN 连接
ipcMain.handle('stop-openvpn', async () => {
  if (!openvpnProcess) return { ok: false }
  openvpnProcess.kill('SIGTERM')
  return { ok: true }
})

// --- 管理接口连接 ---
function connectMgmt() {
    // 连接到OpenVPN的管理接口
  mgmtClient = net.createConnection({ port: mgmtPort, host: '127.0.0.1' }, () => {
    mainWindow.webContents.send('ovpn-log', 'Connected to management interface.')
    // 发送管理命令
    mgmtClient.write('state on\nbytecount 1\nhold release\n')
  })

  // 转发管理接口数据到渲染进程
  mgmtClient.on('data', buf => {
    const txt = buf.toString()
    mainWindow.webContents.send('ovpn-mgmt', txt)
  })

  // 处理管理接口错误
  mgmtClient.on('error', e => {
    mainWindow.webContents.send('ovpn-log', 'Mgmt error: ' + e.message)
  })
}
