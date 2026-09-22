const { app, BrowserWindow, ipcMain, dialog, protocol, shell, Tray, Menu, nativeImage, screen } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const http = require('http');
const os = require('os');
const { pathToFileURL } = require('url');

const AUDIO_EXT = new Set([
  '.mp3', '.wav', '.flac', '.ogg', '.oga', '.m4a', '.aac',
  '.webm', '.opus', '.mp4', '.aiff', '.aif',
]);

let mainWindow = null;
let tray = null;
let trayPopup = null;
let closeAction = 'tray'; // tray | quit
let forceQuit = false;
let mediaPlaying = false;

function getTrayIcon() {
  const p = path.join(__dirname, 'src', 'icon.png');
  try {
    if (fs.existsSync(p)) return nativeImage.createFromPath(p);
  } catch { /* ignore */ }
  return null;
}

let hideTrayTimer = null;

function pointInRect(pt, r) {
  return pt.x >= r.x && pt.x <= r.x + r.width && pt.y >= r.y && pt.y <= r.y + r.height;
}

function pointerOverTrayUI() {
  try {
    const pt = screen.getCursorScreenPoint();
    if (trayPopup && !trayPopup.isDestroyed() && trayPopup.isVisible()) {
      if (pointInRect(pt, trayPopup.getBounds())) return true;
    }
    if (tray) {
      const tb = tray.getBounds();
      const pad = { x: tb.x - 6, y: tb.y - 6, width: tb.width + 12, height: tb.height + 12 };
      if (pointInRect(pt, pad)) return true;
    }
  } catch { /* ignore */ }
  return false;
}

function scheduleHideTrayPopup(delay = 220) {
  clearTimeout(hideTrayTimer);
  hideTrayTimer = setTimeout(() => {
    if (pointerOverTrayUI()) {
      scheduleHideTrayPopup(350);
      return;
    }
    destroyTrayPopup();
  }, delay);
}

function destroyTrayPopup() {
  clearTimeout(hideTrayTimer);
  if (trayPopup && !trayPopup.isDestroyed()) trayPopup.close();
  trayPopup = null;
}

function showTrayPopup() {
  if (!tray) return;
  if (trayPopup && !trayPopup.isDestroyed()) {
    try {
      trayPopup.webContents.send('tray:state', mediaPlaying);
      trayPopup.focus();
      return;
    } catch {
      destroyTrayPopup();
    }
  }
  trayPopup = new BrowserWindow({
    width: 300,
    height: 64,
    frame: false,
    resizable: false,
    movable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    backgroundColor: '#0c0d11',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  try {
    const bounds = tray.getBounds();
    const x = Math.round(bounds.x + bounds.width / 2 - 150);
    const y = Math.round(Math.max(8, bounds.y - 72));
    trayPopup.setPosition(x, y, false);
  } catch { /* ignore */ }

  trayPopup.loadFile(path.join(__dirname, 'src', 'tray-popup.html'));
  trayPopup.once('ready-to-show', () => {
    if (!trayPopup || trayPopup.isDestroyed()) return;
    trayPopup.show();
    trayPopup.focus();
    trayPopup.webContents.send('tray:state', mediaPlaying);
  });
  trayPopup.on('blur', () => {
    scheduleHideTrayPopup(150);
  });
}

function hideToTray() {
  if (!mainWindow) return;
  if (!tray) {
    // first time: tray created below
  }
  if (!tray) {
    const icon = getTrayIcon();
    tray = new Tray(icon || nativeImage.createEmpty());
    // 不显示托盘悬停提示文字
    tray.setToolTip('');
    tray.on('mouse-enter', () => {
      clearTimeout(hideTrayTimer);
      showTrayPopup();
    });
    tray.on('mouse-leave', () => {
      scheduleHideTrayPopup(180);
    });
    tray.on('click', () => {
      clearTimeout(hideTrayTimer);
      showTrayPopup();
    });
    tray.on('right-click', () => {
      clearTimeout(hideTrayTimer);
      showTrayPopup();
    });
    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
      destroyTrayPopup();
    });
  }
  mainWindow.hide();
}

function createTray() {
  if (tray) return tray;
  hideToTray();
  return tray;
}

function buildTrayMenu() {
  return null;
}

// 任务管理器 / 任务栏显示为 JT Player
app.setName('JT Player');
app.setAppUserModelId('com.jtplayer.shenTing');

// 允许启动时自动播放（无需先点击页面）
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

function getStateFile() {
  return path.join(app.getPath('userData'), 'jt-player-state.json');
}

function getLyricsCacheDir() {
  // 默认：系统临时目录下的独立文件夹（如 C:\Users\<用户>\AppData\Local\Temp\JTPlayer-lyrics）
  const dir = path.join(os.tmpdir(), 'JTPlayer-lyrics');
  try { fs.mkdirSync(dir, { recursive: true }); } catch { /* ignore */ }
  return dir;
}

function lyricsCacheKey(artist, title) {
  return `${(artist || '').trim()}___${(title || '').trim()}`
    .replace(/[\\/:*?"<>|]+/g, '_')
    .slice(0, 120);
}

function readLyricsCache(artist, title) {
  try {
    const p = path.join(getLyricsCacheDir(), `${lyricsCacheKey(artist, title)}.lrc`);
    if (!fs.existsSync(p)) return null;
    return fs.readFileSync(p, 'utf8');
  } catch {
    return null;
  }
}

function writeLyricsCache(artist, title, text, source) {
  try {
    const p = path.join(getLyricsCacheDir(), `${lyricsCacheKey(artist, title)}.lrc`);
    const header = source ? `[by:jt-online:${source}]\n` : '';
    fs.writeFileSync(p, header + text, 'utf8');
    return p;
  } catch {
    return null;
  }
}

function httpGet(url, headers = {}, timeout = 12000) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https:') ? https : http;
    const req = mod.get(url, { headers, timeout }, (res) => {
      if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        res.resume();
        httpGet(res.headers.location, headers, timeout).then(resolve, reject);
        return;
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: buf.toString('utf8'),
          buffer: buf,
        });
      });
    });
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy(new Error('timeout'));
    });
  });
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return null; }
}

/** 网易云：搜索 + 取歌词（公开网页接口，仅供本地播放器检索） */
async function searchNeteaseLyrics(title, artist) {
  const keyword = [title, artist].filter(Boolean).join(' ').trim();
  if (!keyword) return null;

  const searchUrl =
    'https://music.163.com/api/search/get/web?csrf_token=&hlpretag=&hlposttag=&s=' +
    encodeURIComponent(keyword) +
    '&type=1&offset=0&total=true&limit=8';

  const headers = {
    Referer: 'https://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Cookie: 'appver=2.0.2; os=pc;',
    Accept: 'application/json,text/plain,*/*',
  };

  const searchRes = await httpGet(searchUrl, headers);
  const searchJson = safeJson(searchRes.body);
  const songs = searchJson?.result?.songs || [];
  if (!songs.length) return null;

  // 简单匹配：优先歌名/歌手相近
  const t = (title || '').toLowerCase();
  const a = (artist || '').toLowerCase();
  const ranked = songs.map((s, i) => {
    const st = String(s.name || '').toLowerCase();
    const sa = (s.artists || s.ar || []).map((x) => x.name).join(' ').toLowerCase();
    let score = 10 - i;
    if (t && st.includes(t)) score += 20;
    if (a && sa && sa.includes(a)) score += 15;
    if (t && t.includes(st) && st) score += 8;
    return { song: s, score };
  }).sort((x, y) => y.score - x.score);

  const best = ranked[0]?.song;
  if (!best?.id) return null;

  const lyricUrl = `https://music.163.com/api/song/lyric?id=${best.id}&lv=1&kv=1&tv=-1`;
  const lyricRes = await httpGet(lyricUrl, headers);
  const lyricJson = safeJson(lyricRes.body);
  let lrc = lyricJson?.lrc?.lyric || '';
  if (!lrc || lrc.trim().length < 8) return null;

  // 去掉无时间戳的空行噪声，保留元信息
  lrc = lrc.replace(/\n{3,}/g, '\n\n').trim();
  return {
    source: 'netease',
    title: best.name || title,
    artist: (best.artists || best.ar || []).map((x) => x.name).join(' / ') || artist,
    id: best.id,
    lyrics: lrc,
  };
}

/** QQ 音乐：搜索 + 歌词 */
async function searchQqLyrics(title, artist) {
  const keyword = [title, artist].filter(Boolean).join(' ').trim();
  if (!keyword) return null;

  const searchUrl =
    'https://c.y.qq.com/soso/fcgi-bin/client_search_cp?w=' +
    encodeURIComponent(keyword) +
    '&p=1&n=8&format=json&cr=1&g_tk=5381';

  const headers = {
    Referer: 'https://y.qq.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Accept: 'application/json,text/plain,*/*',
  };

  const searchRes = await httpGet(searchUrl, headers);
  const searchJson = safeJson(searchRes.body?.replace(/^callback\(|\)$/g, '') || searchRes.body);
  const list = searchJson?.data?.song?.list || [];
  if (!list.length) return null;

  const t = (title || '').toLowerCase();
  const a = (artist || '').toLowerCase();
  const ranked = list.map((s, i) => {
    const st = String(s.songname || s.name || '').toLowerCase();
    const sa = String(s.singer?.map?.((x) => x.name).join(' ') || s.singername || '').toLowerCase();
    let score = 10 - i;
    if (t && st.includes(t)) score += 20;
    if (a && sa && sa.includes(a)) score += 15;
    return { song: s, score };
  }).sort((x, y) => y.score - x.score);

  const best = ranked[0]?.song;
  const mid = best?.songmid || best?.mid;
  if (!mid) return null;

  const lyricUrl =
    'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=' +
    encodeURIComponent(mid) +
    '&format=json&nobase64=1&g_tk=5381';

  const lyricRes = await httpGet(lyricUrl, {
    ...headers,
    Referer: 'https://y.qq.com/portal/player.html',
  });

  let lyricJson = safeJson(lyricRes.body);
  if (!lyricJson && /callback\(/.test(lyricRes.body || '')) {
    lyricJson = safeJson(lyricRes.body.replace(/^callback\(/, '').replace(/\);?\s*$/, ''));
  }
  const lrc = lyricJson?.lyric || '';
  if (!lrc || String(lrc).trim().length < 8) return null;

  return {
    source: 'qq',
    title: best.songname || title,
    artist: best.singer?.map?.((x) => x.name).join(' / ') || artist,
    id: mid,
    lyrics: String(lrc).trim(),
  };
}

function clearLyricsCacheFor(title, artist, filePath) {
  const dir = getLyricsCacheDir();
  const pathMod = require('path');
  const needles = [];
  const push = (s) => {
    const t = String(s || '').trim().toLowerCase();
    if (t && t !== '未知艺术家') needles.push(t);
  };
  push(title);
  push(artist);
  if (filePath) push(pathMod.parse(String(filePath)).name);

  // 曲名拆成较长片段，便于匹配缓存文件名
  const tokens = [];
  for (const n of needles) {
    const flat = n.replace(/[\s_]+/g, '');
    if (flat.length >= 2) tokens.push(flat);
    // 中文连续子串
    const parts = n.split(/[\s\-_/·、,，]+/).filter((x) => x.length >= 2);
    for (const p of parts) tokens.push(p.replace(/[\s_]+/g, ''));
  }

  const exact = new Set();
  if (title || artist) exact.add(lyricsCacheKey(artist, title));
  if (filePath) {
    const base = pathMod.parse(String(filePath)).name;
    exact.add(lyricsCacheKey('', base));
    exact.add(lyricsCacheKey(artist || '', base));
  }

  let removed = 0;
  let total = 0;
  try {
    fs.mkdirSync(dir, { recursive: true });
    for (const f of fs.readdirSync(dir)) {
      if (!f.toLowerCase().endsWith('.lrc')) continue;
      total += 1;
      const name = f.replace(/\.lrc$/i, '');
      const nameLo = name.toLowerCase();
      const nameFlat = nameLo.replace(/[_\s]+/g, '');
      let hit = exact.has(name);
      if (!hit) {
        for (const tk of tokens) {
          if (tk && nameFlat.includes(tk)) {
            hit = true;
            break;
          }
        }
      }
      if (hit) {
        try {
          fs.unlinkSync(pathMod.join(dir, f));
          removed += 1;
        } catch { /* ignore */ }
      }
    }
  } catch { /* ignore */ }

  return { ok: true, removed, total, path: dir, title, artist, needles };
}

function clearAllLyricsCache() {
  const dir = getLyricsCacheDir();
  let removed = 0;
  try {
    for (const f of fs.readdirSync(dir)) {
      if (!f.toLowerCase().endsWith('.lrc')) continue;
      try { fs.unlinkSync(path.join(dir, f)); removed += 1; } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  return { ok: true, removed, path: dir };
}

/** 返回多条候选歌词（当前仅网易多结果；QQ 取最优一条） */
async function searchOnlineLyricsCandidates({ title, artist, source = 'auto', limit = 5 }) {
  const keyword = [title, artist].filter(Boolean).join(' ').trim();
  if (!keyword) return { ok: false, error: '缺少歌名', candidates: [] };

  const candidates = [];
  const headers = {
    Referer: 'https://music.163.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    Cookie: 'appver=2.0.2; os=pc;',
    Accept: 'application/json,text/plain,*/*',
  };

  if (source === 'auto' || source === 'netease') {
    try {
      const searchUrl =
        'https://music.163.com/api/search/get/web?s=' +
        encodeURIComponent(keyword) +
        '&type=1&offset=0&total=true&limit=8';
      const searchRes = await httpGet(searchUrl, headers);
      const searchJson = safeJson(searchRes.body);
      const songs = (searchJson?.result?.songs || []).slice(0, limit);
      const t = String(title || '').toLowerCase();
      const a = String(artist || '').toLowerCase();
      const ranked = songs.map((s, i) => {
        const st = String(s.name || '').toLowerCase();
        const sa = (s.artists || s.ar || []).map((x) => x.name).join(' ').toLowerCase();
        let score = 10 - i;
        if (t && st.includes(t)) score += 20;
        if (a && sa && sa.includes(a)) score += 15;
        return { song: s, score };
      }).sort((x, y) => y.score - x.score);

      for (const { song } of ranked) {
        if (candidates.length >= limit) break;
        try {
          const lyricUrl = `https://music.163.com/api/song/lyric?id=${song.id}&lv=1&kv=1&tv=-1`;
          const lyricRes = await httpGet(lyricUrl, headers);
          const lyricJson = safeJson(lyricRes.body);
          const lrc = lyricJson?.lrc?.lyric || '';
          if (!lrc || lrc.trim().length < 8) continue;
          candidates.push({
            source: 'netease',
            title: song.name || title,
            artist: (song.artists || song.ar || []).map((x) => x.name).join(' / ') || artist,
            id: song.id,
            lyrics: lrc.replace(/\n{3,}/g, '\n\n').trim(),
          });
        } catch { /* next */ }
      }
    } catch { /* ignore */ }
  }

  if ((source === 'auto' || source === 'qq') && candidates.length < limit) {
    try {
      const qq = await searchQqLyrics(title, artist);
      if (qq?.lyrics) {
        candidates.push({
          source: 'qq',
          title: qq.title || title,
          artist: qq.artist || artist,
          id: qq.id,
          lyrics: qq.lyrics,
        });
      }
    } catch { /* ignore */ }
  }

  return {
    ok: candidates.length > 0,
    candidates,
    error: candidates.length ? null : '未找到歌词',
  };
}

async function searchOnlineLyrics({ title, artist, source = 'auto', useCache = true }) {
  if (useCache) {
    const cached = readLyricsCache(artist, title);
    if (cached && cached.trim().length > 8) {
      return { ok: true, cached: true, source: 'cache', lyrics: cached, title, artist };
    }
  }

  const order = source === 'netease'
    ? ['netease']
    : source === 'qq'
      ? ['qq']
      : ['netease', 'qq'];

  const errors = [];
  for (const src of order) {
    try {
      const hit = src === 'netease'
        ? await searchNeteaseLyrics(title, artist)
        : await searchQqLyrics(title, artist);
      if (hit?.lyrics) {
        writeLyricsCache(hit.artist || artist, hit.title || title, hit.lyrics, hit.source);
        writeLyricsCache(artist, title, hit.lyrics, hit.source);
        return {
          ok: true,
          cached: false,
          source: hit.source,
          lyrics: hit.lyrics,
          title: hit.title,
          artist: hit.artist,
          id: hit.id,
        };
      }
      errors.push(`${src}: no result`);
    } catch (err) {
      errors.push(`${src}: ${String(err.message || err)}`);
    }
  }

  return { ok: false, error: errors.join('; ') || '未找到歌词' };
}

function loadAppState() {
  try {
    const p = getStateFile();
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  } catch {
    return null;
  }
}

function saveAppState(state) {
  try {
    const p = getStateFile();
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf8');
    return { ok: true, path: p };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
}

function createWindow() {
  const iconPath = path.join(__dirname, 'src', 'icon.png');
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1100,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    maximized: true,
    backgroundColor: '#090A0C',
    title: 'JT Player 静听',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  mainWindow.once('ready-to-show', () => {
    // 默认最大化打开
    if (!mainWindow.isMaximized()) mainWindow.maximize();
    mainWindow.show();
    const args = process.argv.slice(1).filter((a) => {
      if (!a || a.startsWith('-')) return false;
      if (a === '.' || a.endsWith('electron.exe') || a.endsWith('cli.js')) return false;
      return isAudioFile(a) || require('fs').existsSync(a);
    });
    if (args.length) {
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('jt:open-paths', args.filter(isAudioFile));
      });
    }
  });

  mainWindow.on('close', (e) => {
    if (!forceQuit && closeAction === 'tray') {
      e.preventDefault();
      hideToTray();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function isAudioFile(filePath) {
  return AUDIO_EXT.has(path.extname(filePath).toLowerCase());
}

async function walkAudioFiles(dir, acc = [], depth = 0) {
  if (depth > 8 || acc.length >= 2000) return acc;
  let entries;
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true });
  } catch {
    return acc;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walkAudioFiles(full, acc, depth + 1);
    } else if (isAudioFile(full)) {
      acc.push(full);
    }
  }
  return acc;
}

async function readMetadata(filePath, options = {}) {
  const includeCover = !!options.includeCover;
  const includeLyrics = options.includeLyrics !== false;
  const fallback = {
    title: path.parse(filePath).name,
    artist: '未知艺术家',
    album: '未知专辑',
    duration: 0,
    format: path.extname(filePath).replace('.', '').toUpperCase() || 'AUDIO',
    sampleRate: null,
    bitsPerSample: null,
    bitrate: null,
    codec: null,
    lossless: false,
    cover: null,
  };

  try {
    const mm = await import('music-metadata');
    // 批量读列表时跳过封面，避免几十上百张专辑图占内存
    const meta = await mm.parseFile(filePath, {
      duration: true,
      skipCovers: !includeCover,
    });
    const common = meta.common || {};
    const format = meta.format || {};

    let cover = null;
    if (includeCover && common.picture && common.picture[0]) {
      const pic = common.picture[0];
      const buf = Buffer.from(pic.data);
      const mime = pic.format || 'image/jpeg';
      cover = `data:${mime};base64,${buf.toString('base64')}`;
    }

    const codec = format.codec || format.container || null;
    const lossless = /flac|alac|pcm|wav|aiff|ape|wavpack/i.test(String(codec || '')) ||
      /flac|wav|aiff?/i.test(path.extname(filePath).toLowerCase());

    let lyrics = null;
    if (includeLyrics) {
      if (Array.isArray(common.lyrics) && common.lyrics.length) {
        const hit = common.lyrics.find((x) => x && (x.text || x.lyrics)) ||
          common.lyrics[0];
        lyrics = String(hit?.text || hit?.lyrics || '').trim() || null;
      } else if (typeof common.lyrics === 'string' && common.lyrics.trim()) {
        lyrics = common.lyrics.trim();
      }
    }

    return {
      title: common.title || fallback.title,
      artist: common.artist || (common.artists && common.artists[0]) || fallback.artist,
      album: common.album || fallback.album,
      duration: format.duration || 0,
      format: (format.container || path.extname(filePath).replace('.', '') || 'AUDIO').toUpperCase(),
      sampleRate: format.sampleRate || null,
      bitsPerSample: format.bitsPerSample || null,
      bitrate: format.bitrate ? Math.round(format.bitrate / 1000) : null,
      codec: codec,
      lossless,
      cover,
      lyrics,
    };
  } catch {
    return fallback;
  }
}

function findLrcCandidates(filePath) {
  const dir = path.dirname(filePath);
  const base = path.parse(filePath).name;
  return [
    path.join(dir, `${base}.lrc`),
    path.join(dir, `${base}.LRC`),
    path.join(dir, `${base}.txt`),
  ];
}

async function readSidecarLrc(filePath) {
  const candidates = findLrcCandidates(filePath);
  for (const p of candidates) {
    try {
      const text = await fs.promises.readFile(p, 'utf8');
      if (text && text.trim()) return { path: p, text };
    } catch {
      /* try next */
    }
  }
  return null;
}

ipcMain.handle('dialog:openBgImages', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '选择歌词背景图片（可多选）',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'] },
    ],
  });
  if (result.canceled) return [];
  return result.filePaths;
});

ipcMain.handle('dialog:openFiles', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '打开音频文件',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: '音频', extensions: [...AUDIO_EXT].map((e) => e.slice(1)) },
      { name: '所有文件', extensions: ['*'] },
    ],
  });
  if (result.canceled) return [];
  return result.filePaths.filter(isAudioFile);
});

ipcMain.handle('dialog:openFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: '打开音乐文件夹',
    properties: ['openDirectory'],
  });
  if (result.canceled) return [];
  return walkAudioFiles(result.filePaths[0]);
});

ipcMain.handle('meta:read', async (_e, filePath, options) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return { ok: false, error: '文件不存在' };
  }
  const data = await readMetadata(filePath, options || {});
  const lrc = await readSidecarLrc(filePath);
  if (lrc?.text) {
    data.lyrics = data.lyrics || lrc.text;
    data.lyricsPath = lrc.path;
    data.lyricsSource = data.lyrics && data.lyrics !== lrc.text ? data.lyricsSource || 'embedded' : 'lrc';
  } else if (data.lyrics) {
    data.lyricsSource = 'embedded';
  }
  return { ok: true, data, path: filePath, url: pathToFileURL(filePath).href };
});

ipcMain.handle('meta:cover', async (_e, filePath) => {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    const data = await readMetadata(filePath, { includeCover: true, includeLyrics: false });
    return data.cover || null;
  } catch {
    return null;
  }
});

ipcMain.handle('fs:readText', async (_e, filePath) => {
  if (!filePath) return null;
  try {
    return await fs.promises.readFile(filePath, 'utf8');
  } catch {
    return null;
  }
});

ipcMain.handle('fs:findLrc', async (_e, audioPath) => {
  if (!audioPath) return null;
  return readSidecarLrc(audioPath);
});

ipcMain.handle('fs:exists', async (_e, filePath) => {
  try {
    await fs.promises.access(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:readBuffer', async (_e, filePath) => {
  if (!filePath) return null;
  try {
    const buf = await fs.promises.readFile(filePath);
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
  } catch {
    return null;
  }
});

ipcMain.handle('state:load', async () => loadAppState());
ipcMain.handle('state:save', async (_e, state) => saveAppState(state || {}));
ipcMain.handle('state:path', async () => getStateFile());

ipcMain.handle('lyrics:searchOnline', async (_e, payload) => {
  try {
    return await searchOnlineLyrics(payload || {});
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('lyrics:searchCandidates', async (_e, payload) => {
  try {
    return await searchOnlineLyricsCandidates(payload || {});
  } catch (err) {
    return { ok: false, candidates: [], error: String(err.message || err) };
  }
});

ipcMain.handle('lyrics:clearCache', async (_e, payload) => {
  try {
    return clearLyricsCacheFor(payload?.title, payload?.artist, payload?.path);
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('lyrics:clearAllCache', async () => {
  try {
    return clearAllLyricsCache();
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle('lyrics:cachePath', async () => getLyricsCacheDir());

ipcMain.handle('lyrics:openCacheDir', async () => {
  try {
    const dir = getLyricsCacheDir();
    fs.mkdirSync(dir, { recursive: true });
    const err = await shell.openPath(dir);
    return { ok: !err, path: dir, error: err || null };
  } catch (e) {
    return { ok: false, path: null, error: String(e.message || e) };
  }
});

ipcMain.handle('shell:openPath', async (_e, target) => {
  try {
    if (!target) return { ok: false, error: 'empty path' };
    const p = String(target);
    if (!fs.existsSync(p)) {
      return { ok: false, error: 'path not found', path: p };
    }
    const st = fs.statSync(p);
    const err = await shell.openPath(st.isDirectory() ? p : path.dirname(p));
    return { ok: !err, path: p, error: err || null };
  } catch (e) {
    return { ok: false, error: String(e.message || e) };
  }
});

ipcMain.handle('prefs:setCloseAction', async (_e, action) => {
  closeAction = action === 'quit' ? 'quit' : 'tray';
  return closeAction;
});

ipcMain.handle('media:setPlaying', async (_e, on) => {
  mediaPlaying = !!on;
  if (trayPopup && !trayPopup.isDestroyed()) {
    trayPopup.webContents.send('tray:state', mediaPlaying);
  }
  return mediaPlaying;
});

ipcMain.handle('tray:send', async (_e, cmd) => {
  if (cmd === 'toggle' || cmd === 'prev' || cmd === 'next') {
    if (mainWindow) mainWindow.webContents.send('media:control', cmd);
  } else if (cmd === 'show') {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
    destroyTrayPopup();
  } else if (cmd === 'hide') {
    scheduleHideTrayPopup(80);
  } else if (cmd === 'ping') {
    return true;
  } else if (cmd === 'quit') {
    forceQuit = true;
    destroyTrayPopup();
    if (mainWindow) mainWindow.destroy();
    app.quit();
  }
  return cmd;
});

ipcMain.handle('prefs:getCloseAction', async () => closeAction);

ipcMain.handle('window:hideToTray', async () => {
  hideToTray();
  return true;
});

ipcMain.handle('window:show', async () => {
  if (mainWindow) {
    mainWindow.show();
    mainWindow.focus();
  }
  return true;
});

app.whenReady().then(() => {
  protocol.registerFileProtocol('jtfile', (request, callback) => {
    try {
      const url = request.url.replace('jtfile://', '');
      const decoded = decodeURIComponent(url);
      callback({ path: decoded });
    } catch {
      callback({ error: -2 });
    }
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (forceQuit) {
    app.quit();
    return;
  }
  if (closeAction === 'tray') {
    createTray();
    return;
  }
  if (process.platform !== 'darwin') app.quit();
});
