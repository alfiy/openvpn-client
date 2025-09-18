const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  importConfig: () => ipcRenderer.invoke('import-config'),
  listConfigs: () => ipcRenderer.invoke('list-configs'),
  startOpenVPN: (opts) => ipcRenderer.invoke('start-openvpn', opts),
  stopOpenVPN: () => ipcRenderer.invoke('stop-openvpn'),
  onOvpnLog: (cb) => ipcRenderer.on('ovpn-log', (e, msg) => cb(msg)),
  onOvpnExit: (cb) => ipcRenderer.on('ovpn-exit', (e, d) => cb(d)),
  onMgmt: (cb) => ipcRenderer.on('ovpn-mgmt', (e, d) => cb(d))
})
