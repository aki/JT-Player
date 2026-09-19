const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('jt', {
  openFiles: () => ipcRenderer.invoke('dialog:openFiles'),
  openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
  readMeta: (filePath) => ipcRenderer.invoke('meta:read', filePath),
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
