const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('jt', {
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readMeta: (filePath, options) => ipcRenderer.invoke('meta:read', filePath, options),
  readCover: (filePath) => ipcRenderer.invoke('meta:cover', filePath),
  fileExists: (filePath) => ipcRenderer.invoke('fs:exists', filePath),
  readBuffer: (filePath) => ipcRenderer.invoke('fs:readBuffer', filePath),
  readText: (filePath) => ipcRenderer.invoke('fs:readText', filePath),
  findLrc: (audioPath) => ipcRenderer.invoke('fs:findLrc', audioPath),
  loadState: () => ipcRenderer.invoke('state:load'),
  saveState: (state) => ipcRenderer.invoke('state:save', state),
  getStatePath: () => ipcRenderer.invoke('state:path'),
  searchOnlineLyrics: (payload) => ipcRenderer.invoke('lyrics:searchOnline', payload),
  searchLyricCandidates: (payload) => ipcRenderer.invoke('lyrics:searchCandidates', payload),
  clearLyricsCache: (payload) => ipcRenderer.invoke('lyrics:clearCache', payload),
  clearAllLyricsCache: () => ipcRenderer.invoke('lyrics:clearAllCache'),
  lyricsCachePath: () => ipcRenderer.invoke('lyrics:cachePath'),
  openLyricsCacheDir: () => ipcRenderer.invoke('lyrics:openCacheDir'),
  openPath: (p) => ipcRenderer.invoke('shell:openPath', p),
  openBgImages: () => ipcRenderer.invoke('dialog:openBgImages'),
  setCloseAction: (action) => ipcRenderer.invoke('prefs:setCloseAction', action),
  getCloseAction: () => ipcRenderer.invoke('prefs:getCloseAction'),
  hideToTray: () => ipcRenderer.invoke('window:hideToTray'),
  showWindow: () => ipcRenderer.invoke('window:show'),
  setMediaPlaying: (on) => ipcRenderer.invoke('media:setPlaying', on),
  onMediaControl: (cb) => ipcRenderer.on('media:control', (_e, cmd) => cb(cmd)),
  onTrayState: (cb) => ipcRenderer.on('tray:state', (_e, playing) => cb(playing)),
  traySend: (cmd) => ipcRenderer.invoke('tray:send', cmd),
  getPathForFile: (file) => {
    try {
      return webUtils.getPathForFile(file);
    } catch {
      return file && file.path ? file.path : null;
    }
  },
  onOpenPaths: (cb) => ipcRenderer.on('jt:open-paths', (_e, paths) => cb(paths)),
  isDesktop: true,
});
