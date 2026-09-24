/* JT Player 静听 — renderer */

const AUDIO_EXT = /\.(mp3|wav|flac|ogg|oga|m4a|aac|webm|opus|mp4|aiff|aif)$/i;
const DECODE_MAX_BYTES = 24 * 1024 * 1024; // 波形解码上限，降低内存

const el = (id) => document.getElementById(id);

const dom = {
  audio: el('audio'),
  video: el('stageVideo'),
  stageVisual: el('stageVisual'),
  playlist: el('playlist'),
  trackCount: el('trackCount'),
  nowTitle: el('nowTitle'),
  nowArtist: el('nowArtist'),
  nowCover: el('nowCover'),
  nowCoverFallback: el('nowCoverFallback'),
  nowBadges: el('nowBadges'),
  statusNowPlaying: el('statusNowPlaying'),
  engineLed: el('engineLed'),
  engineState: el('engineState'),
  stageCover: el('stageCover'),
  stageVisual: el('stageVisual'),
  stageChip: el('stageChip'),
  lyrics: el('lyrics'),
  vuL: el('vuL'),
  vuR: el('vuR'),
  vuLDb: el('vuLDb'),
  vuRDb: el('vuRDb'),
  timeCurrent: el('timeCurrent'),
  timeTotal: el('timeTotal'),
  transportTime: el('transportTime'),
  lyricScroll: el('lyricScroll'),
  lyricBadge: el('lyricBadge'),
  lyricsMenu: el('lyricsMenu'),
  stageChip: el('stageChip'),
  btnOpenLyricsCache: el('btnOpenLyricsCache'),
  transportRate: el('transportRate'),
  transportFmt: el('transportFmt'),
  trackIndex: el('trackIndex'),
  trackTotal: el('trackTotal'),
  seekBar: el('seekBar'),
  waveHit: el('waveHit'),
  waveScrubLine: el('waveScrubLine'),
  volumeBar: el('volumeBar'),
  volVal: el('volVal'),
  waveCanvas: el('waveCanvas'),
  rtaCanvas: el('rtaCanvas'),
  lyricBgCanvas: el('lyricBgCanvas'),
  stageBgCustom: el('stageBgCustom'),
  setBgSpectrum: el('setBgSpectrum'),
  setBgMode: el('setBgMode'),
  setBgInterval: el('setBgInterval'),
  setBgIntervalVal: el('setBgIntervalVal'),
  btnPickBgImages: el('btnPickBgImages'),
  btnClearBgImages: el('btnClearBgImages'),
  bgImagesHint: el('bgImagesHint'),
  cdDisc: el('cdDisc'),
  cdLabel: el('cdLabel'),
  cdCover: el('cdCover'),
  cdArt: document.querySelector('.cd-art'),
  cdArtFallback: el('cdArtFallback'),
  formatStrip: el('formatStrip'),
  dspLine: el('dspLine'),
  needleL: el('needleL'),
  needleR: el('needleR'),
  btnPlay: el('btnPlay'),
  iconPlay: el('iconPlay'),
  iconPause: el('iconPause'),
  btnPrev: el('btnPrev'),
  btnNext: el('btnNext'),
  btnAddFiles: el('btnAddFiles'),
  btnAddFolder: el('btnAddFolder'),
  btnClear: el('btnClear'),
  confirmOverlay: el('confirmOverlay'),
  confirmMessage: el('confirmMessage'),
  btnConfirmOk: el('btnConfirmOk'),
  btnConfirmCancel: el('btnConfirmCancel'),
  btnSearch: el('btnSearch'),
  btnSearchClear: el('btnSearchClear'),
  playlistSearchBar: el('playlistSearchBar'),
  playlistSearchInput: el('playlistSearchInput'),
  searchHint: el('searchHint'),
  btnMute: el('btnMute'),
  btnDsp: el('btnDsp'),
  btnEq: el('btnEq'),
  eqOverlay: el('eqOverlay'),
  btnCloseEq: el('btnCloseEq'),
  btnCloseEqFoot: el('btnCloseEqFoot'),
  eqEnabled: el('eqEnabled'),
  eqPresetSelect: el('eqPresetSelect'),
  btnEqReset: el('btnEqReset'),
  eqBands: el('eqBands'),
  eqPreamp: el('eqPreamp'),
  eqPreampVal: el('eqPreampVal'),
  eqHp: el('eqHp'),
  eqLp: el('eqLp'),
  eqCurve: el('eqCurve'),
  eqStatus: el('eqStatus'),
  playlistMenu: el('playlistMenu'),
  btnRepeat: el('btnRepeat'),
  btnBrand: el('btnBrand'),
  brandSub: el('brandSub') || document.querySelector('.brand-sub'),
  settingsOverlay: el('settingsOverlay'),
  btnCloseSettings: el('btnCloseSettings'),
  btnCloseSettingsFoot: el('btnCloseSettingsFoot'),
  btnResetSettings: el('btnResetSettings'),
  setRepeat: el('setRepeat'),
  setVolumeStep: el('setVolumeStep'),
  setAutoplay: el('setAutoplay'),
  setAutoplayLaunch: el('setAutoplayLaunch'),
  setLyricSize: el('setLyricSize'),
  setLyricSizeVal: el('setLyricSizeVal'),
  setShowDeck: el('setShowDeck'),
  setCloseAction: el('setCloseAction'),
  setDspPreset: el('setDspPreset'),
  setSubtitle: el('setSubtitle'),
  setOnlineLyrics: el('setOnlineLyrics'),
  setLyricsSource: el('setLyricsSource'),
  setLyricOffset: el('setLyricOffset'),
  setLyricOffsetVal: el('setLyricOffsetVal'),
  setLyricColor: el('setLyricColor'),
  setLyricColorVal: el('setLyricColorVal'),
  setLyricOpacity: el('setLyricOpacity'),
  setLyricOpacityVal: el('setLyricOpacityVal'),
  fileInput: el('fileInput'),
  app: el('app'),
};

const state = {
  tracks: [],
  index: -1,
  selectedIndex: -1,
  selectedSet: new Set(),
  selectionAnchor: -1,
  repeat: 'all', // one | shuffle | all
  playing: false,
  shuffle: false,
  volume: 0.85,
  muted: false,
  seeking: false,
  wavePeaks: null,
  levels: { l: 0, r: 0 },
  smoothLevels: { l: 0, r: 0 },
  rtaBars: new Float32Array(32),
  lyricBgPeaks: null,
  bgSpectrum: true,
  bgMode: 'cover',
  bgImages: [],
  bgIntervalSec: 8,
  bgImageIdx: 0,
  bgTimer: null,
  lastPeaks: null,
  resumePosition: 0,
  resumePath: null,
  resumeTrackId: null,
  trackPositions: {},
  videoMode: false,
  restoring: false,
  searchQuery: '',
  eqEnabled: false,
  eqPreset: 'FLAT',
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  eqPreampDb: 0,
  eqHpHz: 0,
  eqLpHz: 0,
  dspPreset: 'FLAT',
  lyrics: {
    timed: null,
    plain: null,
    index: -1,
    source: null,
    trackId: null,
    offsetSec: 0,
  },
  volumeStep: 0.05,
  autoplayAfterAdd: true,
};

const SETTINGS_KEY = 'jt-player-settings-v1';
const DEFAULT_SETTINGS = {
  repeat: 'all',
  volumeStep: 0.05,
  autoplayAfterAdd: true,
  autoplayOnLaunch: false,
  closeAction: 'tray',
  lyricSize: 16,
  lyricActiveColor: '#3DDBD9',
  lyricOpacity: 100,
  showDeck: true,
  subtitle: '静听HIFI音乐，享HIFI人生。',
  onlineLyrics: true,
  lyricsSource: 'auto',
  lyricOffsetMs: 0,
  lyricActiveColor: '#3DDBD9',
  eqEnabled: false,
  eqPreset: 'FLAT',
  eqGains: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  eqPreampDb: 0,
  eqHpHz: 0,
  eqLpHz: 0,
  dspPreset: 'FLAT',
  bgSpectrum: true,
  bgMode: 'cover',
  bgImages: [],
  bgIntervalSec: 8,
};

/** 10 段图示 EQ（ISO 近似）：低切/前级/高切 + 各频段 */
const EQ_BANDS = [
  { freq: 31, label: '31', type: 'lowshelf', q: 0.7 },
  { freq: 62, label: '62', type: 'peaking', q: 1.1 },
  { freq: 125, label: '125', type: 'peaking', q: 1.1 },
  { freq: 250, label: '250', type: 'peaking', q: 1.1 },
  { freq: 500, label: '500', type: 'peaking', q: 1.1 },
  { freq: 1000, label: '1k', type: 'peaking', q: 1.1 },
  { freq: 2000, label: '2k', type: 'peaking', q: 1.1 },
  { freq: 4000, label: '4k', type: 'peaking', q: 1.1 },
  { freq: 8000, label: '8k', type: 'peaking', q: 1.1 },
  { freq: 16000, label: '16k', type: 'highshelf', q: 0.7 },
];

/** DSP / EQ 预设（dB，对应 10 段） */
const DSP_PRESETS = {
  FLAT:        [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  VOCAL:       [-3, -1, 1, 3, 4, 3, 2, 1, 0, -1],
  CLASSIC:     [-2, -1, 0, 1, 1, 2, 3, 3, 2, 1],
  JAZZ:        [2, 1, 0, 1, 2, 1, 1, 2, 3, 3],
  ROCK:        [4, 3, 1, -1, -1, 1, 2, 3, 4, 4],
  HEADPHONE:   [2, 1, 0, 0, 1, 2, 3, 3, 4, 5],
  BASS:        [6, 5, 3, 1, 0, 0, 0, 0, 1, 1],
  TREBLE:      [-1, -1, 0, 0, 0, 1, 2, 4, 5, 6],
  CUSTOM:      [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

// 磁盘状态缓存（Electron userData / localStorage 双写）
let diskState = {
  settings: { ...DEFAULT_SETTINGS },
  tracks: [],
  index: -1,
  selectedIndex: -1,
  volume: 0.85,
  muted: false,
};

function readLocalStorageJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLocalStorageJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function trackIdentityKeys(track) {
  const keys = [];
  if (track.path) {
    keys.push('p:' + String(track.path).replace(/\\/g, '/').toLowerCase().trim());
  }
  const title = String(track.meta?.title || track.name || '').toLowerCase().trim();
  const artist = String(track.meta?.artist || '').toLowerCase().trim();
  const dur = Math.round(Number(track.duration || track.meta?.duration || 0));
  if (title) keys.push(`t:${title}|${artist}|${dur}`);
  const base = String(track.name || '').toLowerCase().trim();
  if (base && !track.path) keys.push('n:' + base);
  return keys;
}

/** 列表去重：同一路径或同一曲名+歌手+时长只保留一条 */
function dedupeTrackList(tracks) {
  const seen = new Set();
  const out = [];
  for (const t of tracks) {
    if (!t) continue;
    const keys = trackIdentityKeys(t);
    const uniqueKey = keys.find((k) => !seen.has(k));
    // 任一标识已存在则视为重复
    const isDup = keys.length > 0 && keys.every((k) => seen.has(k));
    if (isDup) continue;
    for (const k of keys) seen.add(k);
    if (uniqueKey || keys.length === 0) out.push(t);
  }
  return out;
}

function dedupePlaylistInPlace() {
  const before = state.tracks.length;
  const playingPath = state.index >= 0 ? state.tracks[state.index]?.path : null;
  const playingId = state.index >= 0 ? state.tracks[state.index]?.id : null;
  state.tracks = dedupeTrackList(state.tracks);
  if (state.tracks.length !== before) {
    const idxById = playingId ? state.tracks.findIndex((t) => t.id === playingId) : -1;
    const idxByPath = playingPath
      ? state.tracks.findIndex((t) => t.path && t.path === playingPath)
      : -1;
    const nextIdx = idxById >= 0 ? idxById : idxByPath;
    state.index = nextIdx;
    if (state.selectedIndex >= state.tracks.length) {
      setSingleSelection(state.tracks.length ? state.tracks.length - 1 : -1);
    } else if (state.selectedIndex >= 0) {
      const sel = state.tracks[state.selectedIndex];
      if (!sel) setSingleSelection(state.tracks.length ? 0 : -1);
    }
  }
  return before - state.tracks.length;
}

function collectPersistableTracks() {
  return dedupeTrackList(state.tracks)
    .filter((t) => t.path)
    .map((t) => ({
      path: t.path,
      name: t.name,
      duration: t.duration || t.meta?.duration || 0,
      unsupported: !!t.unsupported,
    }));
}

function pathKeyOf(p) {
  return String(p || '').replace(/\\/g, '/').toLowerCase().trim();
}

function currentPlaybackPosition() {
  const track = state.index >= 0 ? state.tracks[state.index] : null;
  if (!track) return 0;
  const el = media();
  if (el.src && Number.isFinite(el.currentTime) && el.currentTime > 0) {
    if (!el.duration || el.currentTime < el.duration - 1.5) {
      return el.currentTime;
    }
  }
  return Number(state.resumePosition) || 0;
}

function buildAppState() {
  const track = state.index >= 0 ? state.tracks[state.index] : null;
  const position = currentPlaybackPosition();
  const positions = { ...(state.trackPositions || {}) };
  if (track?.path && position > 0.8) {
    positions[pathKeyOf(track.path)] = position;
  }
  return {
    version: 2,
    updatedAt: new Date().toISOString(),
    settings: { ...DEFAULT_SETTINGS, ...loadSettings() },
    tracks: collectPersistableTracks(),
    index: state.index,
    selectedIndex: state.selectedIndex,
    volume: state.volume,
    muted: !!state.muted,
    position,
    positionPath: track?.path || state.resumePath || null,
    positions,
  };
}

let saveStateTimer = null;
let lastPositionSaveAt = 0;

function persistAppState(immediate = false) {
  if (state.restoring && !immediate) return null;
  const payload = buildAppState();
  diskState = { ...payload };
  writeLocalStorageJson(SETTINGS_KEY, payload.settings);
  writeLocalStorageJson('jt-player-playlist-v1', {
    tracks: payload.tracks,
    index: payload.index,
    selectedIndex: payload.selectedIndex,
    volume: payload.volume,
    muted: payload.muted,
    position: payload.position,
    positionPath: payload.positionPath,
    positions: payload.positions,
  });

  const flush = () => {
    if (!hasDesktop || !window.jt.saveState) return Promise.resolve();
    return window.jt.saveState(payload).catch(() => null);
  };

  if (immediate) return flush();
  clearTimeout(saveStateTimer);
  saveStateTimer = setTimeout(() => flush(), 400);
  return null;
}

function persistPlaybackProgress(force = false) {
  if (state.restoring) return;
  const now = Date.now();
  // 播放中写盘降频：避免约 3 分钟后 IPC/写盘卡住媒体
  if (!force && now - lastPositionSaveAt < 8000) return;
  lastPositionSaveAt = now;
  const track = state.index >= 0 ? state.tracks[state.index] : null;
  const pos = currentPlaybackPosition();
  if (track?.path && pos > 0.8) {
    state.trackPositions = state.trackPositions || {};
    state.trackPositions[pathKeyOf(track.path)] = pos;
    state.resumePosition = pos;
    state.resumePath = track.path;
  }
  persistAppState(force);
}

function waitAudioReady(timeout = 4000) {
  return new Promise((resolve) => {
    const el = media();
    if (el.readyState >= 1 && el.duration) {
      resolve(true);
      return;
    }
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      el.removeEventListener('loadedmetadata', done);
      el.removeEventListener('canplay', done);
      resolve(!!el.duration);
    };
    el.addEventListener('loadedmetadata', done);
    el.addEventListener('canplay', done);
    setTimeout(done, timeout);
  });
}

async function seekToResumePosition(seconds) {
  const t = Number(seconds);
  if (!Number.isFinite(t) || t <= 0) return false;
  await waitAudioReady();
  const el = media();
  if (!el.duration) return false;
  const target = Math.min(Math.max(0, t), Math.max(0, el.duration - 0.4));
  try {
    el.currentTime = target;
    state.resumePosition = target;
    refreshPlayTimeDisplay(target);
    syncLyrics(target);
    drawWave();
    return true;
  } catch {
    return false;
  }
}

function loadSettings() {
  const fromDisk = diskState?.settings || {};
  const fromLs = readLocalStorageJson(SETTINGS_KEY) || {};
  const merged = { ...DEFAULT_SETTINGS, ...fromDisk, ...fromLs };
  const legacy = new Set([
    '静听 · 音乐静听中',
    '静听 · 呈现中',
    '静听 · 音乐流淌中',
  ]);
  if (!merged.subtitle || legacy.has(merged.subtitle)) {
    merged.subtitle = DEFAULT_SETTINGS.subtitle;
  }
  return merged;
}

function saveSettings(patch) {
  const next = { ...loadSettings(), ...patch };
  diskState.settings = next;
  writeLocalStorageJson(SETTINGS_KEY, next);
  persistAppState(true);
  return next;
}

function normalizeLyricSize(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 16;
  return Math.min(50, Math.max(12, Math.round(n)));
}

function applyLyricSize(value) {
  const px = normalizeLyricSize(value);
  state.lyricSizePx = px;
  document.documentElement.style.setProperty('--lyric-size', `${px}px`);
  if (dom.setLyricSize) dom.setLyricSize.value = String(px);
  if (dom.setLyricSizeVal) dom.setLyricSizeVal.textContent = `${px}px`;
}

function pathToFileUrl(p) {
  if (!p) return '';
  const s = String(p).replace(/\\/g, '/');
  return encodeURI(s.startsWith('/') ? `file://${s}` : `file:///${s}`);
}

function updateBgImagesHint() {
  if (!dom.bgImagesHint) return;
  const n = (state.bgImages || []).length;
  dom.bgImagesHint.textContent = n
    ? `已选 ${n} 张${n > 1 ? ` · 每 ${state.bgIntervalSec}s 轮播` : ''}`
    : '未选择图片';
  if (dom.setBgIntervalVal) dom.setBgIntervalVal.textContent = `${state.bgIntervalSec}s`;
}

function stopBgCarousel() {
  if (state.bgTimer) {
    clearInterval(state.bgTimer);
    state.bgTimer = null;
  }
}

function applyLyricBackground() {
  const vis = dom.stageVisual;
  if (!vis) return;
  const mode = state.bgMode || 'cover';
  vis.classList.remove('bg-cover', 'bg-custom', 'bg-none');
  const imgs = state.bgImages || [];
  const useCustom = mode === 'custom' || (mode === 'cover+custom' && imgs.length > 0);
  if (mode === 'none') {
    vis.classList.add('bg-none');
  } else if (useCustom && imgs.length) {
    vis.classList.add('bg-custom');
  } else if (mode === 'cover+custom' && !imgs.length) {
    vis.classList.add('bg-cover');
  } else if (mode === 'custom' && !imgs.length) {
    vis.classList.add('bg-none');
  } else {
    vis.classList.add('bg-cover');
  }

  // 频谱显隐
  if (dom.lyricBgCanvas) {
    const showSpec = state.bgSpectrum !== false && !state.videoMode;
    dom.lyricBgCanvas.classList.toggle('hidden', !showSpec);
  }

  // 自定义图 / 轮播
  stopBgCarousel();
  if (dom.stageBgCustom) {
    if (useCustom && imgs.length) {
      if (state.bgImageIdx >= imgs.length) state.bgImageIdx = 0;
      dom.stageBgCustom.src = pathToFileUrl(imgs[state.bgImageIdx]);
      if (imgs.length > 1) {
        const sec = Math.max(3, Math.min(30, state.bgIntervalSec || 8));
        state.bgTimer = setInterval(() => {
          if (state.videoMode) return;
          state.bgImageIdx = (state.bgImageIdx + 1) % (state.bgImages || []).length;
          if (dom.stageBgCustom && state.bgImages[state.bgImageIdx]) {
            dom.stageBgCustom.src = pathToFileUrl(state.bgImages[state.bgImageIdx]);
          }
        }, sec * 1000);
      }
    } else {
      dom.stageBgCustom.removeAttribute('src');
    }
  }
  updateBgImagesHint();
}

function applySettings(s) {
  const r = s.repeat;
  if (r === 'one' || r === 'shuffle' || r === 'all') state.repeat = r;
  else state.repeat = 'all';
  state.shuffle = state.repeat === 'shuffle';
  state.volumeStep = Number(s.volumeStep) || 0.05;
  state.autoplayAfterAdd = s.autoplayAfterAdd !== false;
  state.autoplayOnLaunch = !!s.autoplayOnLaunch;
  state.onlineLyrics = s.onlineLyrics !== false;
  state.lyricsSource = (s.lyricsSource === 'netease' || s.lyricsSource === 'qq') ? s.lyricsSource : 'auto';
  state.lyricOffsetMs = Math.min(2000, Math.max(-2000, Number(s.lyricOffsetMs) || 0));
  applyLyricSize(s.lyricSize);
  applyLyricOffset(state.lyricOffsetMs);
  applyLyricColor(s.lyricActiveColor);
  applyLyricOpacity(s.lyricOpacity);
  state.closeAction = s.closeAction === 'quit' ? 'quit' : 'tray';
  if (hasDesktop && window.jt.setCloseAction) {
    try { window.jt.setCloseAction(state.closeAction); } catch { /* ignore */ }
  }
  state.eqEnabled = !!s.eqEnabled;
  const preset = DSP_PRESETS[s.dspPreset] ? s.dspPreset : (DSP_PRESETS[s.eqPreset] ? s.eqPreset : 'FLAT');
  state.eqPreset = preset;
  state.dspPreset = preset;
  // 有保存的增益则优先用；否则按预设展开
  state.eqGains = normalizeEqGains(s.eqGains || DSP_PRESETS[preset] || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  state.eqPreampDb = Math.min(12, Math.max(-12, Number(s.eqPreampDb) || 0));
  state.eqHpHz = Number(s.eqHpHz) || 0;
  state.eqLpHz = Number(s.eqLpHz) || 0;
  state.bgSpectrum = s.bgSpectrum !== false;
  state.bgMode = ['cover', 'custom', 'cover+custom', 'none'].includes(s.bgMode) ? s.bgMode : 'cover';
  state.bgImages = Array.isArray(s.bgImages) ? s.bgImages.filter(Boolean) : [];
  state.bgIntervalSec = Math.min(30, Math.max(3, Number(s.bgIntervalSec) || 8));
  if (dom.setBgSpectrum) dom.setBgSpectrum.checked = state.bgSpectrum;
  if (dom.setBgMode) dom.setBgMode.value = state.bgMode;
  if (dom.setBgInterval) dom.setBgInterval.value = String(state.bgIntervalSec);
  applyLyricBackground();
  if (dom.btnDsp) {
    dom.btnDsp.textContent = state.dspPreset;
    dom.btnDsp.classList.toggle('active', state.dspPreset !== 'FLAT');
  }
  if (dom.eqEnabled) dom.eqEnabled.checked = state.eqEnabled;
  if (dom.eqPresetSelect) dom.eqPresetSelect.value = state.eqPreset;
  if (dom.setDspPreset) dom.setDspPreset.value = state.dspPreset;
  document.body.classList.toggle('hide-deck', s.showDeck === false);
  if (dom.brandSub) {
    dom.brandSub.textContent = s.subtitle || DEFAULT_SETTINGS.subtitle;
  }
  updateRepeatBtn();
  applyEqToGraph();
}

function fillSettingsForm(s) {
  if (dom.setRepeat) dom.setRepeat.value = s.repeat === 'one' || s.repeat === 'shuffle' ? s.repeat : 'all';
  if (dom.setVolumeStep) dom.setVolumeStep.value = String(s.volumeStep || 0.05);
  if (dom.setAutoplay) dom.setAutoplay.checked = s.autoplayAfterAdd !== false;
  if (dom.setAutoplayLaunch) dom.setAutoplayLaunch.checked = !!s.autoplayOnLaunch;
  if (dom.setCloseAction) {
    dom.setCloseAction.value = s.closeAction === 'quit' ? 'quit' : 'tray';
  }
  if (dom.setDspPreset) {
    dom.setDspPreset.value = DSP_PRESETS[state.eqPreset] ? state.eqPreset : 'CUSTOM';
  }
  applyLyricSize(s.lyricSize);
  if (dom.setShowDeck) dom.setShowDeck.checked = s.showDeck !== false;
  if (dom.setSubtitle) dom.setSubtitle.value = s.subtitle || DEFAULT_SETTINGS.subtitle;
  if (dom.setOnlineLyrics) dom.setOnlineLyrics.checked = s.onlineLyrics !== false;
  if (dom.setLyricsSource) {
    dom.setLyricsSource.value = (s.lyricsSource === 'netease' || s.lyricsSource === 'qq') ? s.lyricsSource : 'auto';
  }
  applyLyricOffset(s.lyricOffsetMs);
  applyLyricColor(s.lyricActiveColor);
  applyLyricOpacity(s.lyricOpacity);
}

function applyLyricColor(value) {
  const hex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(value || '').trim())
    ? String(value).trim()
    : '#3DDBD9';
  state.lyricActiveColor = hex;
  document.documentElement.style.setProperty('--lyric-active-color', hex);
  if (dom.setLyricColor) dom.setLyricColor.value = hex.length === 4
    ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
    : hex;
  if (dom.setLyricColorVal) dom.setLyricColorVal.textContent = hex.toUpperCase();
}

function normalizeLyricOpacity(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 100;
  return Math.min(100, Math.max(30, Math.round(n)));
}

function applyLyricOpacity(value) {
  const pct = normalizeLyricOpacity(value);
  state.lyricOpacity = pct;
  document.documentElement.style.setProperty('--lyric-opacity', String(pct / 100));
  if (dom.setLyricOpacity) dom.setLyricOpacity.value = String(pct);
  if (dom.setLyricOpacityVal) dom.setLyricOpacityVal.textContent = `${pct}%`;
}

function applyLyricOffset(ms) {
  const v = Math.min(2000, Math.max(-2000, Number(ms) || 0));
  state.lyricOffsetMs = v;
  if (dom.setLyricOffset) dom.setLyricOffset.value = String(v);
  if (dom.setLyricOffsetVal) {
    dom.setLyricOffsetVal.textContent = `${v > 0 ? '+' : ''}${v}ms`;
  }
  if (state.lyrics && Number.isFinite(audio.currentTime)) {
    syncLyrics(audio.currentTime, true);
  }
}

function openSettings() {
  if (!dom.settingsOverlay) return;
  fillSettingsForm({ ...loadSettings(), ...readSettingsForm(), eqPreset: state.eqPreset, dspPreset: state.dspPreset, eqGains: state.eqGains, eqEnabled: state.eqEnabled });
  const hint = el('statePathHint');
  if (hint) {
    hint.textContent = '状态文件：读取中…';
    if (hasDesktop && window.jt.getStatePath) {
      window.jt.getStatePath().then((p) => {
        if (p) hint.textContent = `状态文件：${p}`;
      }).catch(() => {
        hint.textContent = '状态文件：本地用户数据目录';
      });
    } else {
      hint.textContent = '状态文件：浏览器本地存储';
    }
  }
  const cacheHint = el('lyricsCachePathHint');
  if (cacheHint) {
    cacheHint.textContent = '歌词缓存：—';
    if (hasDesktop && window.jt.lyricsCachePath) {
      window.jt.lyricsCachePath().then((p) => {
        if (p) cacheHint.textContent = `歌词缓存：${p}`;
      }).catch(() => {
        cacheHint.textContent = '歌词缓存：系统临时目录/JTPlayer-lyrics';
      });
    }
  }
  dom.settingsOverlay.hidden = false;
}

function closeSettings() {
  if (!dom.settingsOverlay) return;
  dom.settingsOverlay.hidden = true;
}

function readSettingsForm() {
  return {
    repeat: dom.setRepeat?.value || 'all',
    volumeStep: Number(dom.setVolumeStep?.value || 0.05),
    autoplayAfterAdd: dom.setAutoplay ? !!dom.setAutoplay.checked : true,
    autoplayOnLaunch: dom.setAutoplayLaunch ? !!dom.setAutoplayLaunch.checked : false,
    closeAction: dom.setCloseAction?.value === 'quit' ? 'quit' : 'tray',
    dspPreset: state.dspPreset || 'FLAT',
    eqPreset: state.eqPreset || 'FLAT',
    lyricSize: normalizeLyricSize(dom.setLyricSize?.value),
    showDeck: dom.setShowDeck ? !!dom.setShowDeck.checked : true,
    subtitle: (dom.setSubtitle?.value || '').trim() || DEFAULT_SETTINGS.subtitle,
    onlineLyrics: dom.setOnlineLyrics ? !!dom.setOnlineLyrics.checked : true,
    lyricsSource: dom.setLyricsSource?.value || 'auto',
    lyricOffsetMs: Math.min(2000, Math.max(-2000, Number(dom.setLyricOffset?.value) || 0)),
    lyricActiveColor: dom.setLyricColor?.value || DEFAULT_SETTINGS.lyricActiveColor,
    lyricOpacity: normalizeLyricOpacity(dom.setLyricOpacity?.value),
    eqEnabled: !!state.eqEnabled,
    eqPreset: state.eqPreset || 'FLAT',
    eqGains: normalizeEqGains(state.eqGains),
    eqPreampDb: Number(state.eqPreampDb) || 0,
    eqHpHz: Number(state.eqHpHz) || 0,
    eqLpHz: Number(state.eqLpHz) || 0,
    dspPreset: state.dspPreset || state.eqPreset || 'FLAT',
  bgSpectrum: state.bgSpectrum !== false,
  bgMode: state.bgMode || 'cover',
  bgImages: Array.isArray(state.bgImages) ? state.bgImages : [],
  bgIntervalSec: state.bgIntervalSec || 8,
  };
}

function persistSettingsFromForm() {
  const patch = readSettingsForm();
  const s = saveSettings(patch);
  applySettings(s);
}

if (dom.setOnlineLyrics) { /* lyrics settings handled below */ }

// 歌词背景设置
if (dom.setDspPreset) {
  dom.setDspPreset.addEventListener('change', () => {
    applyDspPreset(dom.setDspPreset.value || 'FLAT');
  });
}

if (dom.setBgSpectrum) {
  dom.setBgSpectrum.addEventListener('change', () => {
    state.bgSpectrum = !!dom.setBgSpectrum.checked;
    applyLyricBackground();
    persistSettingsFromForm();
  });
}
if (dom.setBgMode) {
  dom.setBgMode.addEventListener('change', () => {
    state.bgMode = dom.setBgMode.value || 'cover';
    applyLyricBackground();
    persistSettingsFromForm();
  });
}
if (dom.setBgInterval) {
  dom.setBgInterval.addEventListener('input', () => {
    state.bgIntervalSec = Number(dom.setBgInterval.value) || 8;
    if (dom.setBgIntervalVal) dom.setBgIntervalVal.textContent = `${state.bgIntervalSec}s`;
    applyLyricBackground();
  });
  dom.setBgInterval.addEventListener('change', persistSettingsFromForm);
}
if (dom.btnPickBgImages) {
  dom.btnPickBgImages.addEventListener('click', async () => {
    if (!hasDesktop || !window.jt.openBgImages) return;
    const paths = await window.jt.openBgImages();
    if (!paths || !paths.length) return;
    state.bgImages = [...new Set([...(state.bgImages || []), ...paths])];
    state.bgImageIdx = 0;
    if (state.bgMode === 'cover') {
      state.bgMode = 'custom';
      if (dom.setBgMode) dom.setBgMode.value = 'custom';
    }
    applyLyricBackground();
    persistSettingsFromForm();
  });
}
if (dom.btnClearBgImages) {
  dom.btnClearBgImages.addEventListener('click', () => {
    state.bgImages = [];
    state.bgImageIdx = 0;
    applyLyricBackground();
    persistSettingsFromForm();
  });
}

// 字号滑条：拖动即时预览，松开/变更后写入设置
if (dom.setLyricSize) {
  dom.setLyricSize.addEventListener('input', () => {
    applyLyricSize(dom.setLyricSize.value);
  });
  dom.setLyricSize.addEventListener('change', persistSettingsFromForm);
}
if (dom.setLyricOffset) {
  dom.setLyricOffset.addEventListener('input', () => {
    applyLyricOffset(dom.setLyricOffset.value);
  });
  dom.setLyricOffset.addEventListener('change', persistSettingsFromForm);
}
if (dom.setLyricColor) {
  dom.setLyricColor.addEventListener('input', () => {
    applyLyricColor(dom.setLyricColor.value);
  });
  dom.setLyricColor.addEventListener('change', persistSettingsFromForm);
}
if (dom.setLyricOpacity) {
  dom.setLyricOpacity.addEventListener('input', () => {
    applyLyricOpacity(dom.setLyricOpacity.value);
  });
  dom.setLyricOpacity.addEventListener('change', persistSettingsFromForm);
}

async function restoreAppState() {
  state.restoring = true;
  try {
    await restoreAppStateInner();
  } finally {
    state.restoring = false;
  }
}

async function restoreAppStateInner() {
  let remote = null;
  if (hasDesktop && window.jt.loadState) {
    try {
      remote = await window.jt.loadState();
    } catch {
      remote = null;
    }
  }

  const localPlaylist = readLocalStorageJson('jt-player-playlist-v1') || {};
  const localSettings = readLocalStorageJson(SETTINGS_KEY) || {};

  const remoteTracks = Array.isArray(remote?.tracks) ? remote.tracks : null;
  const localTracks = Array.isArray(localPlaylist.tracks) ? localPlaylist.tracks : null;
  const tracks = (remoteTracks && remoteTracks.length)
    ? remoteTracks
    : (localTracks && localTracks.length) ? localTracks : [];

  const remotePos = Number(remote?.position);
  const localPos = Number(localPlaylist.position);
  let resumePosition = Number.isFinite(remotePos) && remotePos > 0
    ? remotePos
    : (Number.isFinite(localPos) && localPos > 0 ? localPos : 0);
  let resumePath = remote?.positionPath || localPlaylist.positionPath || null;
  const positions = {
    ...(localPlaylist.positions || {}),
    ...(remote?.positions || {}),
  };
  state.trackPositions = positions;

  diskState = {
    settings: {
      ...DEFAULT_SETTINGS,
      ...localSettings,
      ...(remote?.settings || {}),
    },
    tracks,
    index: Number.isFinite(remote?.index) && remote.index >= 0
      ? remote.index
      : (Number.isFinite(localPlaylist.index) ? localPlaylist.index : -1),
    selectedIndex: Number.isFinite(remote?.selectedIndex) && remote.selectedIndex >= 0
      ? remote.selectedIndex
      : (Number.isFinite(localPlaylist.selectedIndex) ? localPlaylist.selectedIndex : -1),
    volume: Number.isFinite(remote?.volume)
      ? remote.volume
      : Number.isFinite(localPlaylist.volume) ? localPlaylist.volume : 0.85,
    muted: !!(remote?.muted ?? localPlaylist.muted),
    position: resumePosition,
    positionPath: resumePath,
    positions,
  };

  // 设置
  applySettings(diskState.settings);
  writeLocalStorageJson(SETTINGS_KEY, diskState.settings);

  // 音量（恢复期间不写盘）
  state.volume = Math.min(1, Math.max(0, Number(diskState.volume) || 0.85));
  state.muted = !!diskState.muted;
  applyVolume();

  // 播放列表
  const rawTracks = dedupeTrackList(tracks || []);
  const paths = [];
  const seenPath = new Set();
  for (const t of rawTracks) {
    if (!t?.path) continue;
    const key = pathKeyOf(t.path);
    if (seenPath.has(key)) continue;
    seenPath.add(key);
    paths.push(t.path);
  }

  if (paths.length) {
    // 启动恢复：滚动到上次列表位置附近，但不打断续播逻辑
    await addPaths(paths, { autoplay: false, selectFirst: false, scrollToNew: false });
  }

  const removed = dedupePlaylistInPlace();
  if (removed > 0) renderPlaylist();

  if (!state.tracks.length) {
    renderPlaylist();
    updateNowUI();
    return;
  }

  // 用文件路径定位上次曲目（比 index 更稳）
  let playTarget = -1;
  if (resumePath) {
    const k = pathKeyOf(resumePath);
    playTarget = state.tracks.findIndex((t) => t.path && pathKeyOf(t.path) === k);
  }
  if (playTarget < 0) {
    const savedIdx = diskState.index;
    if (Number.isInteger(savedIdx) && savedIdx >= 0 && savedIdx < state.tracks.length) {
      playTarget = savedIdx;
    }
  }
  if (playTarget < 0 && state.autoplayOnLaunch === true) {
    playTarget = state.tracks.findIndex((t) => !t.unsupported);
  }

  // 没有进度时：未开自动播放则不必强行加载
  const autoPlay = state.autoplayOnLaunch === true || diskState.settings?.autoplayOnLaunch === true;
  if (playTarget < 0 && !autoPlay) {
    const sel = Number.isInteger(diskState.selectedIndex) ? diskState.selectedIndex : 0;
    state.selectedIndex = Math.min(Math.max(0, sel), state.tracks.length - 1);
    state.index = -1;
    renderPlaylist();
    updateNowUI();
    return;
  }
  if (playTarget < 0) playTarget = state.tracks.findIndex((t) => !t.unsupported);
  if (playTarget < 0) {
    renderPlaylist();
    updateNowUI();
    return;
  }

  // 续播进度：优先按路径查表，其次用全局 position
  const targetTrack = state.tracks[playTarget];
  if (!resumePosition && targetTrack?.path) {
    resumePosition = Number(positions[pathKeyOf(targetTrack.path)]) || 0;
  }
  if (!resumePath && targetTrack?.path) resumePath = targetTrack.path;

  state.index = playTarget;
  setSingleSelection(
    Number.isInteger(diskState.selectedIndex) && diskState.selectedIndex >= 0
      ? Math.min(diskState.selectedIndex, state.tracks.length - 1)
      : playTarget
  );
  state.resumePosition = resumePosition > 0 ? resumePosition : 0;
  state.resumePath = resumePath;
  renderPlaylist();
  updateNowUI();

  const shouldResume = resumePosition > 1 && targetTrack &&
    (!resumePath || (targetTrack.path && pathKeyOf(targetTrack.path) === pathKeyOf(resumePath)) ||
      !resumePath);

  // 启动：无论是否自动播放，都加载上次曲目并定位进度
  await loadTrack(playTarget, autoPlay, {
    resumeAt: shouldResume ? resumePosition : 0,
    useSavedPosition: true,
  });

  if (!autoPlay && resumePosition > 1) {
    await seekToResumePosition(resumePosition);
    syncEngineFromAudio();
  }

  // 此时进度已在 audio 上，写盘保留
  persistAppState(true);
}

const audio = dom.audio;
const video = dom.video;

/** 当前媒体元素：视频用 <video>，其余用 <audio> */
function media() {
  return state.videoMode ? (video || audio) : audio;
}

function isVideoName(name = '') {
  return /\.(mp4|m4v|webm|mov|mkv)$/i.test(String(name));
}

function applyStageMode() {
  const on = !!state.videoMode;
  if (dom.stageVisual) dom.stageVisual.classList.toggle('mode-video', on);
  if (on && video) {
    video.classList.add('is-active');
  } else if (video) {
    video.classList.remove('is-active');
  }
  applyLyricBackground();
}

let audioCtx = null;
let sourceNode = null;
let videoSourceNode = null;
let splitter = null;
let analyserL = null;
let analyserR = null;
let masterAnalyser = null;
let gainNode = null;
let eqFilters = [];
let eqPreamp = null;
let eqHpFilter = null;
let eqLpFilter = null;

function ensureAudioGraph() {
  if (audioCtx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  audioCtx = new AC();
  sourceNode = audioCtx.createMediaElementSource(audio);
  gainNode = audioCtx.createGain();
  gainNode.gain.value = 1;

  masterAnalyser = audioCtx.createAnalyser();
  masterAnalyser.fftSize = 256;
  masterAnalyser.smoothingTimeConstant = 0.78;

  splitter = audioCtx.createChannelSplitter(2);
  analyserL = audioCtx.createAnalyser();
  analyserR = audioCtx.createAnalyser();
  analyserL.fftSize = 256;
  analyserR.fftSize = 256;
  analyserL.smoothingTimeConstant = 0.72;
  analyserR.smoothingTimeConstant = 0.72;

  // EQ 链：gain → preamp → bands → analyser → destination
  eqPreamp = audioCtx.createGain();
  eqPreamp.gain.value = 1;
  eqHpFilter = audioCtx.createBiquadFilter();
  eqHpFilter.type = 'highpass';
  eqHpFilter.frequency.value = 10;
  eqHpFilter.Q.value = 0.707;
  eqLpFilter = audioCtx.createBiquadFilter();
  eqLpFilter.type = 'lowpass';
  eqLpFilter.frequency.value = 22050;
  eqLpFilter.Q.value = 0.707;
  eqFilters = EQ_BANDS.map((b) => {
    const f = audioCtx.createBiquadFilter();
    f.type = b.type;
    f.frequency.value = b.freq;
    f.Q.value = b.q || 1.1;
    f.gain.value = 0;
    return f;
  });

  sourceNode.connect(splitter);
  splitter.connect(analyserL, 0);
  splitter.connect(analyserR, 1);
  sourceNode.connect(gainNode);
  if (video) {
    try {
      videoSourceNode = audioCtx.createMediaElementSource(video);
      videoSourceNode.connect(splitter);
      videoSourceNode.connect(gainNode);
    } catch { /* already */ }
  }
  gainNode.connect(eqPreamp);
  let node = eqPreamp;
  node.connect(eqHpFilter);
  node = eqHpFilter;
  for (const f of eqFilters) {
    node.connect(f);
    node = f;
  }
  node.connect(eqLpFilter);
  node = eqLpFilter;
  node.connect(masterAnalyser);
  masterAnalyser.connect(audioCtx.destination);

  applyEqToGraph();
}

function applyVolume() {
  const v = state.muted ? 0 : state.volume;
  audio.volume = v;
  if (video) video.volume = v;
  if (gainNode) gainNode.gain.value = 1;
  dom.volVal.textContent = state.muted ? '0' : String(Math.round(state.volume * 100));
  dom.volumeBar.value = String(Math.round((state.muted ? 0 : state.volume) * 100));
  if (!state.restoring) persistAppState();
}

const hasDesktop = typeof window.jt?.openFiles === 'function';

function fmtTime(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '00:00';
  const s = Math.floor(sec);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}

function fmtDb(v) {
  if (!v || v <= 0.00001) return '-∞';
  const db = 20 * Math.log10(v);
  return db <= -48 ? '-∞' : `${db.toFixed(1)}`;
}

function resumeCtx() {
  ensureAudioGraph();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  // 出图后始终恢复单位增益，避免误静音
  if (gainNode) gainNode.gain.value = 1;
  if (eqPreamp) eqPreamp.gain.value = 1;
}

function isAudioActuallyPlaying() {
  const el = media();
  return !!el.src && !el.paused && !el.ended;
}

function setEngine(playing) {
  // 有音频源时以 <audio> 实际状态为准，避免自动播放后被错误标成 PAUSED
  const mel = media();
  const next = mel.src ? isAudioActuallyPlaying() : !!playing;

  state.playing = next;
  dom.engineLed.classList.toggle('on', next);
  dom.engineState.textContent = next ? 'PLAYING' : mel.src ? 'PAUSED' : 'STANDBY';
  if (dom.btnPlay) dom.btnPlay.classList.toggle('is-playing', !!next);
  if (dom.iconPlay) {
    dom.iconPlay.hidden = !!next;
    dom.iconPlay.style.display = next ? 'none' : '';
  }
  if (dom.iconPause) {
    dom.iconPause.hidden = !next;
    dom.iconPause.style.display = next ? '' : 'none';
  }
  dom.cdDisc.classList.toggle('spinning', next);
  dom.stageChip.textContent = next
    ? (state.videoMode ? 'VIDEO READING' : 'LASER READING')
    : mel.src ? 'PAUSE' : 'LASER STANDBY';
  dom.dspLine.textContent = next
    ? `DSP: 32-BIT FLOAT · ${state.dspPreset || 'FLAT'}${state.eqEnabled ? ' · EQ' : ''} · ACTIVE`
    : `DSP: 32-BIT FLOAT · ${state.dspPreset || 'FLAT'}${state.eqEnabled ? ' · EQ' : ''} · 待机`;
  if (hasDesktop && window.jt.setMediaPlaying) {
    try { window.jt.setMediaPlaying(next); } catch { /* ignore */ }
  }
}

function syncEngineFromAudio() {
  setEngine(isAudioActuallyPlaying());
}

function renderBadges(meta) {
  const badges = [];
  if (meta.lossless) badges.push(`<span class="badge">HI-FI 无损</span>`);
  if (meta.sampleRate) badges.push(`<span class="badge red">${Math.round(meta.sampleRate / 100) / 10}kHz</span>`);
  if (meta.format) badges.push(`<span class="badge cyan">${escapeHtml(String(meta.format))}</span>`);
  if (!badges.length) badges.push('<span class="badge cyan">LOCAL</span>');
  dom.nowBadges.innerHTML = badges.join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function setCover(url, name) {
  const has = Boolean(url);
  if (has) {
    dom.nowCover.src = url;
    dom.stageCover.src = url;
    dom.cdCover.src = url;
    dom.nowCover.style.opacity = '1';
    dom.nowCoverFallback.style.opacity = '0';
    dom.stageVisual.classList.add('has-cover');
    dom.cdArt.classList.add('has-cover');
    dom.cdArtFallback.style.opacity = '0';
  } else {
    dom.nowCover.removeAttribute('src');
    dom.stageCover.removeAttribute('src');
    dom.cdCover.removeAttribute('src');
    dom.nowCover.style.opacity = '0';
    dom.nowCoverFallback.style.opacity = '1';
    dom.stageVisual.classList.remove('has-cover');
    dom.cdArt.classList.remove('has-cover');
    dom.cdArtFallback.style.opacity = '1';
  }
  const short = (name || 'JT').slice(0, 2).toUpperCase();
  dom.nowCoverFallback.textContent = short;
  dom.cdLabel.textContent = short;
  dom.cdArtFallback.textContent = 'COVER';
}

function parseLrc(text) {
  if (!text || typeof text !== 'string') return null;
  // 去 BOM / 零宽字符
  const normalized = text
    .replace(/^﻿/, '')
    .replace(/[​-‍﻿]/g, '')
    .replace(/\r\n?/g, '\n');
  const lines = normalized.split('\n');
  const timed = [];
  const plain = [];
  let offsetMs = 0;
  const timeRe = /\[(\d{1,2}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    const offMatch = line.match(/^\[offset:\s*([+-]?\d+)\s*\]/i);
    if (offMatch) {
      offsetMs = Number(offMatch[1]) || 0;
      continue;
    }
    if (/^\[(ar|ti|al|by|re|ve|length):/i.test(line)) continue;

    timeRe.lastIndex = 0;
    const stamps = [];
    let m;
    let lastIdx = 0;
    while ((m = timeRe.exec(line))) {
      const min = Number(m[1]);
      const sec = Number(m[2]);
      // 1-2 位按十分之一/百分之一秒，3 位按毫秒
      let frac = 0;
      if (m[3]) {
        const d = m[3];
        if (d.length <= 2) frac = Number(d.padEnd(2, '0')) / 100;
        else frac = Number(d.padEnd(3, '0').slice(0, 3)) / 1000;
      }
      const t = min * 60 + sec + frac;
      stamps.push(t);
      lastIdx = m.index + m[0].length;
    }
    const body = line.slice(lastIdx).trim();
    if (!body && !stamps.length) continue;
    if (stamps.length && body) {
      for (const t of stamps) timed.push({ t, text: body });
    } else if (!stamps.length && body) {
      plain.push(body);
    }
  }

  if (timed.length) {
    timed.sort((a, b) => a.t - b.t);
    return { timed, plain: null, offsetMs };
  }
  if (plain.length) return { timed: null, plain, offsetMs };
  return { timed: null, plain: null, offsetMs };
}

function clearLyricsState() {
  state.lyrics = {
    timed: null,
    plain: null,
    index: -1,
    source: null,
    trackId: null,
    offsetSec: 0,
  };
}

function applyLyricsPayload(trackId, lyricsText, source) {
  if (state.index < 0 || state.tracks[state.index]?.id !== trackId) return;
  if (!lyricsText) {
    clearLyricsState();
    state.lyrics.trackId = trackId;
    const track = state.tracks[state.index];
    setLyricsFallback(track);
    return;
  }
  const parsed = parseLrc(lyricsText);
  const offsetSec = Number(parsed?.offsetMs || 0) / 1000;
  state.lyrics = {
    timed: parsed?.timed || null,
    plain: parsed?.plain || null,
    index: -1,
    source: source || (parsed?.timed ? 'lrc' : 'text'),
    trackId,
    offsetSec,
  };
  renderLyricsView(true);
  if (audio.src && Number.isFinite(audio.currentTime)) {
    syncLyrics(audio.currentTime, true);
  }
}

async function fetchOnlineLyrics(track, trackId) {
  if (!hasDesktop || !window.jt.searchOnlineLyrics) return null;
  if (state.onlineLyrics === false) return null;

  const settings = loadSettings();
  const meta = track.meta || {};
  const title = meta.title || track.name || '';
  const artist = meta.artist || '';
  if (!title || title === '未知艺术家') return null;

  if (dom.lyricBadge) {
    dom.lyricBadge.textContent = '搜索歌词…';
    dom.lyricBadge.className = 'lyric-badge mono';
  }

  try {
    const res = await window.jt.searchOnlineLyrics({
      title,
      artist: artist === '未知艺术家' ? '' : artist,
      source: settings.lyricsSource || state.lyricsSource || 'auto',
      useCache: true,
    });
    if (state.lyrics.trackId !== trackId) return null;
    if (res?.ok && res.lyrics) {
      applyLyricsPayload(trackId, res.lyrics, res.cached ? 'online-cache' : `online-${res.source}`);
      return res;
    }
    if (dom.lyricBadge) {
      dom.lyricBadge.textContent = '无网络歌词';
      dom.lyricBadge.className = 'lyric-badge mono dim';
    }
    return null;
  } catch {
    if (state.lyrics.trackId === trackId && dom.lyricBadge) {
      dom.lyricBadge.textContent = '歌词搜索失败';
      dom.lyricBadge.className = 'lyric-badge mono dim';
    }
    return null;
  }
}

function currentTrackForLyrics() {
  return state.index >= 0 ? state.tracks[state.index] : null;
}

function lyricsRequestPayload(track) {
  const meta = track?.meta || {};
  return {
    title: meta.title || track?.name || '',
    artist: meta.artist === '未知艺术家' ? '' : (meta.artist || ''),
    path: track?.path || '',
  };
}

function setLyricBadge(text, dim = false) {
  if (!dom.lyricBadge) return;
  dom.lyricBadge.textContent = text;
  dom.lyricBadge.className = dim ? 'lyric-badge mono dim' : 'lyric-badge mono';
}

function hideLyricsMenu() {
  if (dom.lyricsMenu) dom.lyricsMenu.hidden = true;
}

function showLyricsMenu() {
  if (!dom.lyricsMenu) return;
  hideSettingsMaybe();
  const track = currentTrackForLyrics();
  const hasTrack = !!track;
  dom.lyricsMenu.querySelectorAll('button[data-lact]').forEach((btn) => {
    const act = btn.getAttribute('data-lact');
    btn.disabled = !hasTrack && act !== 'folder' && act !== 'toggle-online' && act !== 'clear-all';
  });
  const toggle = dom.lyricsMenu.querySelector('[data-lact="toggle-online"]');
  if (toggle) toggle.textContent = state.onlineLyrics === false ? '恢复联网搜索' : '暂停联网搜索';
  dom.lyricsMenu.hidden = false;
  // 立刻可见反馈，避免“点了没反应”
  if (hasTrack) {
    const meta = track.meta || {};
    setLyricBadge(`菜单 · ${meta.title || track.name}`);
  }
}

function hideSettingsMaybe() {
  /* keep settings as-is */
}

async function refreshCurrentLyrics({ ignoreCache = true, clearCacheFirst = false } = {}) {
  const track = currentTrackForLyrics();
  if (!track) return;
  const trackId = track.id;
  const payload = lyricsRequestPayload(track);

  if (clearCacheFirst && hasDesktop && window.jt.clearLyricsCache) {
    try { await window.jt.clearLyricsCache(payload); } catch { /* ignore */ }
  }

  if (hasDesktop && track.path && window.jt.findLrc) {
    try {
      const lrc = await window.jt.findLrc(track.path);
      if (lrc?.text && !clearCacheFirst) {
        applyLyricsPayload(trackId, lrc.text, 'lrc');
        return;
      }
    } catch { /* ignore */ }
  }

  if (!hasDesktop || !window.jt.searchOnlineLyrics) {
    if (track.meta?.lyrics) applyLyricsPayload(trackId, track.meta.lyrics, track.meta.lyricsSource || 'embedded');
    else setLyricsFallback(track);
    return;
  }

  const settings = loadSettings();
  state.lyrics.trackId = trackId;
  const res = await window.jt.searchOnlineLyrics({
    title: payload.title,
    artist: payload.artist,
    source: settings.lyricsSource || state.lyricsSource || 'auto',
    useCache: !ignoreCache,
  });
  if (state.lyrics.trackId !== trackId) return;
  if (res?.ok && res.lyrics) {
    applyLyricsPayload(trackId, res.lyrics, res.cached ? 'online-cache' : `online-${res.source}`);
  } else if (track.meta?.lyrics) {
    applyLyricsPayload(trackId, track.meta.lyrics, track.meta.lyricsSource || 'embedded');
  } else {
    setLyricsFallback(track);
  }
}

let lyricCandidateIdx = 0;
let lyricCandidatesCache = [];

async function switchToNextLyricCandidate() {
  const track = currentTrackForLyrics();
  if (!track || !hasDesktop || !window.jt.searchLyricCandidates) {
    await refreshCurrentLyrics({ ignoreCache: true, clearCacheFirst: true });
    return;
  }
  const trackId = track.id;
  const payload = lyricsRequestPayload(track);
  if (dom.lyricBadge) {
    dom.lyricBadge.textContent = '获取候选歌词…';
    dom.lyricBadge.className = 'lyric-badge mono';
  }
  const settings = loadSettings();
  const res = await window.jt.searchLyricCandidates({
    title: payload.title,
    artist: payload.artist,
    source: settings.lyricsSource || 'auto',
    limit: 6,
  });
  if (state.lyrics.trackId !== trackId) return;
  const list = res?.candidates || [];
  if (!list.length) {
    await refreshCurrentLyrics({ ignoreCache: true, clearCacheFirst: true });
    return;
  }
  lyricCandidatesCache = list;
  lyricCandidateIdx = (lyricCandidateIdx + 1) % list.length;
  const pick = list[lyricCandidateIdx];
  if (hasDesktop && window.jt.clearLyricsCache) {
    try { await window.jt.clearLyricsCache(payload); } catch { /* ignore */ }
  }
  applyLyricsPayload(trackId, pick.lyrics, `online-${pick.source}`);
  if (dom.lyricBadge) {
    dom.lyricBadge.textContent = `候选 ${lyricCandidateIdx + 1}/${list.length} · ${pick.source}`;
  }
}

if (dom.lyricBadge) {
  dom.lyricBadge.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (dom.lyricsMenu && !dom.lyricsMenu.hidden) hideLyricsMenu();
    else showLyricsMenu();
  });
}

if (dom.stageChip) {
  dom.stageChip.style.pointerEvents = 'auto';
  dom.stageChip.style.cursor = 'pointer';
  dom.stageChip.addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    if (dom.lyricsMenu && !dom.lyricsMenu.hidden) hideLyricsMenu();
    else showLyricsMenu();
  });
}

if (dom.lyricsMenu) {
  dom.lyricsMenu.addEventListener('click', async (e) => {
    const btn = e.target.closest('button[data-lact]');
    if (!btn || btn.disabled) return;
    const act = btn.getAttribute('data-lact');
    hideLyricsMenu();
    const track = currentTrackForLyrics();

    if (act === 'refresh') {
      setLyricBadge('重新搜索歌词…');
      await refreshCurrentLyrics({ ignoreCache: true, clearCacheFirst: true });
      setLyricBadge(dom.lyricBadge.textContent.startsWith('重新搜索') ? '歌词已更新' : dom.lyricBadge.textContent);
    } else if (act === 'next') {
      lyricCandidateIdx = 0;
      await switchToNextLyricCandidate();
    } else if (act === 'clear') {
      let removed = 0;
      let cachePath = '';
      if (track && hasDesktop && window.jt.clearLyricsCache) {
        const payload = lyricsRequestPayload(track);
        setLyricBadge('正在清除缓存…');
        const r = await window.jt.clearLyricsCache(payload);
        removed = r?.removed || 0;
        cachePath = r?.path || '';
      }
      setLyricBadge(`已清除缓存 ${removed} 个，重新搜索中…`);
      clearLyricsState();
      if (track) {
        state.lyrics.trackId = track.id;
        setLyricsFallback(track);
      }
      await refreshCurrentLyrics({ ignoreCache: true, clearCacheFirst: false });
      if (dom.lyricBadge && dom.lyricBadge.textContent.includes('重新搜索中')) {
        setLyricBadge(removed > 0 ? `已清除 ${removed} 个缓存` : '本曲无匹配缓存，已忽略缓存重搜', removed === 0);
      }
    } else if (act === 'clear-all') {
      if (hasDesktop && window.jt.clearAllLyricsCache) {
        setLyricBadge('正在清空歌词缓存…');
        const r = await window.jt.clearAllLyricsCache();
        setLyricBadge(`已清空缓存 ${r?.removed || 0} 个`);
        if (track) {
          clearLyricsState();
          state.lyrics.trackId = track.id;
          await refreshCurrentLyrics({ ignoreCache: true, clearCacheFirst: false });
        }
      }
    } else if (act === 'toggle-online') {
      state.onlineLyrics = state.onlineLyrics === false;
      saveSettings({ onlineLyrics: state.onlineLyrics });
      if (dom.setOnlineLyrics) dom.setOnlineLyrics.checked = state.onlineLyrics !== false;
      setLyricBadge(state.onlineLyrics === false ? '已暂停联网歌词' : '已恢复联网歌词', state.onlineLyrics === false);
    } else if (act === 'folder') {
      if (hasDesktop && window.jt.openLyricsCacheDir) {
        const r = await window.jt.openLyricsCacheDir();
        if (r && r.ok) setLyricBadge('已打开歌词缓存目录');
        else setLyricBadge(`无法打开：${r?.error || r?.path || ''}`, true);
      }
    }
  });
}

document.addEventListener('click', (e) => {
  if (!dom.lyricsMenu || dom.lyricsMenu.hidden) return;
  if (e.target.closest('#lyricsMenu') || e.target.closest('#lyricBadge')) return;
  hideLyricsMenu();
});

if (dom.stageVisual) {
  dom.stageVisual.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    showLyricsMenu();
  });
}

async function loadTrackLyrics(track) {
  if (!track?.id) return;
  const trackId = track.id;
  clearLyricsState();
  state.lyrics.trackId = trackId;

  const meta = track.meta || {};
  if (meta.lyrics) {
    applyLyricsPayload(trackId, meta.lyrics, meta.lyricsSource || 'embedded');
    return;
  }

  if (hasDesktop && track.path && window.jt.findLrc) {
    try {
      const lrc = await window.jt.findLrc(track.path);
      if (lrc?.text && state.lyrics.trackId === trackId) {
        applyLyricsPayload(trackId, lrc.text, 'lrc');
        return;
      }
    } catch {
      /* ignore */
    }
  }

  // re-check meta after async enrich
  const latest = state.tracks.find((t) => t.id === trackId);
  if (latest?.meta?.lyrics && state.lyrics.trackId === trackId) {
    applyLyricsPayload(trackId, latest.meta.lyrics, latest.meta.lyricsSource || 'embedded');
    return;
  }

  if (state.lyrics.trackId !== trackId) return;

  // 本地没有 → 可选联网搜索
  if (state.onlineLyrics !== false) {
    const srcTrack = latest || track;
    if (srcTrack.meta?.lyrics && state.lyrics.trackId === trackId) {
      applyLyricsPayload(trackId, srcTrack.meta.lyrics, srcTrack.meta.lyricsSource || 'embedded');
      return;
    }
    setLyricsFallback(srcTrack);
    await fetchOnlineLyrics(srcTrack, trackId);
    return;
  }

  setLyricsFallback(track);
}

function setLyricsFallback(track) {
  if (!dom.lyricScroll) {
    setLyrics(track?.meta?.title || track?.name, track?.meta?.artist);
    return;
  }
  if (!track) {
    dom.lyricScroll.innerHTML = `
      <div class="lyric-line dim">静静聆听</div>
      <div class="lyric-line active">本地曲库 · 高保真回放</div>
      <div class="lyric-line dim">选择文件或文件夹开始</div>`;
    if (dom.lyricBadge) {
      dom.lyricBadge.textContent = '无歌词';
      dom.lyricBadge.className = 'lyric-badge mono dim';
    }
    return;
  }
  const title = track.meta?.title || track.name;
  const artist = track.meta?.artist || '未知艺术家';
  dom.lyricScroll.innerHTML = `
    <div class="lyric-line dim">${escapeHtml(artist)}</div>
    <div class="lyric-line active">${escapeHtml(title)}</div>
    <div class="lyric-line dim">未找到歌词 · 可将同名 .lrc 放在音频旁</div>`;
  if (dom.lyricBadge) {
    dom.lyricBadge.textContent = '无 LRC';
    dom.lyricBadge.className = 'lyric-badge mono dim';
  }
}

function setLyrics(title, artist) {
  if (!title) {
    setLyricsFallback(null);
    return;
  }
  if (dom.lyricScroll) {
    dom.lyricScroll.innerHTML = `
      <div class="lyric-line dim">${escapeHtml(artist || '')}</div>
      <div class="lyric-line active">${escapeHtml(title)}</div>
      <div class="lyric-line dim">静听 · 专注本地回放</div>`;
    if (dom.lyricBadge) {
      dom.lyricBadge.textContent = '曲名信息';
      dom.lyricBadge.className = 'lyric-badge mono dim';
    }
    return;
  }
  dom.lyrics.innerHTML = `
    <div class="lyric-line dim">${escapeHtml(artist || '')}</div>
    <div class="lyric-line active">${escapeHtml(title)}</div>
    <div class="lyric-line dim">静听 · 专注本地回放</div>`;
}

function findLyricIndex(timed, mediaTime) {
  if (!timed?.length) return -1;
  // 用户偏移（设置）+ 歌词文件 [offset:]
  // 正数 → 歌词整体延后显示（与播放器常见约定一致）
  const userMs = Number(state.lyricOffsetMs) || 0;
  const lrcSec = Number(state.lyrics?.offsetSec) || 0;
  const time = (Number(mediaTime) || 0) + lrcSec + userMs / 1000;
  let lo = 0;
  let hi = timed.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (timed[mid].t <= time + 0.12) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

function renderLyricsView(resetScroll = false) {
  if (!dom.lyricScroll) return;
  const { timed, plain, source } = state.lyrics;

  if (timed?.length) {
    const idx = Number.isInteger(state.lyrics.index) ? state.lyrics.index : -1;
    const box = dom.lyricScroll;
    // 单曲歌词量有限，从第 0 句渲染，保证开头可见
    const limit = Math.min(timed.length, 400);
    let html = '';
    for (let i = 0; i < limit; i++) {
      const cls = i === idx ? 'lyric-line active' : 'lyric-line dim';
      html += `<div class="${cls}" data-lyric-index="${i}">${escapeHtml(timed[i].text)}</div>`;
    }
    box.innerHTML = html;
    box.classList.add('is-scrollable');

    if (dom.lyricBadge) {
      const srcMap = {
        embedded: '内嵌歌词',
        lrc: 'LRC 同步',
        'online-netease': '网络歌词 · 网易',
        'online-qq': '网络歌词 · QQ',
        'online-cache': '网络歌词 · 缓存',
      };
      dom.lyricBadge.textContent = srcMap[source] || source || '歌词';
      dom.lyricBadge.className = 'lyric-badge mono';
    }

    const active = idx >= 0 ? box.querySelector('.lyric-line.active') : null;
    const nearStart = idx < 0 || idx <= 4;
    if (resetScroll || nearStart || !active) {
      box.scrollTop = 0;
      return;
    }
    const offset = active.offsetTop - box.clientHeight / 2 + active.clientHeight / 2;
    const target = Math.max(0, offset);
    if (resetScroll) box.scrollTop = target;
    else if (Math.abs(box.scrollTop - target) > 8) {
      box.scrollTo({ top: target, behavior: 'smooth' });
    }
    return;
  }

  if (plain?.length) {
    const shown = plain.slice(0, 80);
    dom.lyricScroll.innerHTML = shown
      .map((line, i) => `<div class="lyric-line ${i === 0 ? 'active' : 'dim'}">${escapeHtml(line)}</div>`)
      .join('');
    dom.lyricScroll.scrollTop = 0;
    if (dom.lyricBadge) {
      dom.lyricBadge.textContent = '文本歌词';
      dom.lyricBadge.className = 'lyric-badge mono';
    }
    return;
  }
}

function syncLyrics(time, force = false) {
  const { timed } = state.lyrics;
  if (!timed?.length) return;
  const idx = findLyricIndex(timed, time);
  if (force || idx !== state.lyrics.index) {
    state.lyrics.index = idx;
    renderLyricsView(false);
  }
}

function refreshPlayTimeDisplay(rawTime) {
  const el = media();
  const t = Number.isFinite(rawTime) ? rawTime : el.currentTime || 0;
  const label = fmtTime(t);
  if (dom.timeCurrent) dom.timeCurrent.textContent = label;
  if (dom.transportTime) dom.transportTime.textContent = label;
  const d = el.duration || state.tracks[state.index]?.duration || 0;
  if (d) dom.timeTotal.textContent = fmtTime(d);
}

function setMeta(track) {
  const meta = track?.meta || {};
  const map = {
    title: meta.title || track?.name || '—',
    artist: meta.artist || '—',
    album: meta.album || '—',
    codec: meta.codec || meta.format || '—',
    sampleRate: meta.sampleRate ? `${meta.sampleRate} Hz` : '—',
    bitrate: [
      meta.bitrate ? `${meta.bitrate} kbps` : null,
      meta.bitsPerSample ? `${meta.bitsPerSample}-bit` : null,
    ].filter(Boolean).join(' · ') || '—',
    quality: meta.lossless ? 'LOSSLESS' : meta.format ? String(meta.format) : '—',
  };
  document.querySelectorAll('[data-meta]').forEach((node) => {
    const key = node.getAttribute('data-meta');
    if (key in map) node.textContent = map[key];
  });

  const strip = [
    meta.format || 'AUDIO',
    meta.lossless ? 'lossless' : 'lossy',
    meta.sampleRate ? `${meta.sampleRate}` : '—',
    meta.bitsPerSample ? `${meta.bitsPerSample}bit` : meta.bitrate ? `${meta.bitrate}k` : '—',
  ];
  dom.formatStrip.innerHTML = strip.map((s) => `<span>${escapeHtml(s)}</span>`).join('');

  dom.transportRate.textContent = meta.sampleRate
    ? `${Math.round(meta.bitrate || 0)} KBPS`
    : meta.bitrate ? `${meta.bitrate} KBPS` : '—';
  dom.transportFmt.textContent = (meta.format || '—').toUpperCase();

  renderBadges(meta || {});
}

function isRowSelected(i) {
  return state.selectedSet.has(i) || i === state.selectedIndex;
}

function setSingleSelection(i) {
  state.selectedSet = new Set(i >= 0 ? [i] : []);
  state.selectedIndex = i;
  state.selectionAnchor = i;
}

function toggleSelection(i) {
  if (i < 0) return;
  if (state.selectedSet.has(i) && state.selectedSet.size > 0 && state.selectedSet.has(state.selectedIndex)) {
    state.selectedSet.delete(i);
  } else {
    state.selectedSet.add(i);
  }
  state.selectedIndex = i;
  state.selectionAnchor = i;
  if (state.selectedSet.size === 0) {
    state.selectedSet.add(i);
    state.selectedIndex = i;
  }
}

function selectRange(i) {
  if (i < 0) return;
  const anchor = Number.isInteger(state.selectionAnchor) && state.selectionAnchor >= 0
    ? state.selectionAnchor
    : (state.selectedIndex >= 0 ? state.selectedIndex : i);
  const a = Math.min(anchor, i);
  const b = Math.max(anchor, i);
  state.selectedSet = new Set();
  for (let k = a; k <= b; k++) state.selectedSet.add(k);
  state.selectedIndex = i;
  // 保持 anchor 不变，便于继续 Shift 连选
  state.selectionAnchor = anchor;
}

/** Ctrl+A：曲目列表全选 */
function selectAllTracks() {
  if (!state.tracks.length) return;
  state.selectedSet = new Set(state.tracks.map((_, i) => i));
  if (state.index >= 0) state.selectedIndex = state.index;
  else state.selectedIndex = 0;
  state.selectionAnchor = state.selectedIndex;
  renderPlaylist();
}

function getSelectedIndices() {
  const set = new Set(state.selectedSet);
  if (state.selectedIndex >= 0) set.add(state.selectedIndex);
  return [...set].filter((i) => i >= 0 && i < state.tracks.length).sort((x, y) => x - y);
}

function remapSelectionAfterRemove(removedIndices) {
  const removed = new Set(removedIndices);
  const oldSelected = getSelectedIndices();
  const nextSet = new Set();
  let nextSelected = -1;
  for (const oldIdx of oldSelected) {
    if (removed.has(oldIdx)) continue;
    let shift = 0;
    for (const r of removed) {
      if (r < oldIdx) shift += 1;
    }
    const newIdx = oldIdx - shift;
    if (newIdx >= 0 && newIdx < state.tracks.length) {
      nextSet.add(newIdx);
      if (nextSelected < 0) nextSelected = newIdx;
    }
  }
  state.selectedSet = nextSet;
  state.selectedIndex = nextSelected;
  state.selectionAnchor = nextSelected;
}

function matchesSearch(track, q) {
  if (!q) return true;
  const s = q.trim().toLowerCase();
  if (!s) return true;
  const title = String(track.meta?.title || track.name || '').toLowerCase();
  const artist = String(track.meta?.artist || '').toLowerCase();
  const album = String(track.meta?.album || '').toLowerCase();
  const file = String(track.name || '').toLowerCase();
  const full = String(track.path || '').toLowerCase();
  return (
    title.includes(s) ||
    artist.includes(s) ||
    album.includes(s) ||
    file.includes(s) ||
    full.includes(s)
  );
}

function getSearchHitIndices() {
  const q = state.searchQuery;
  if (!q || !String(q).trim()) return [];
  const indices = [];
  state.tracks.forEach((t, i) => {
    if (matchesSearch(t, q)) indices.push(i);
  });
  return indices;
}

function updateSearchHint() {
  if (!dom.searchHint) return;
  // 不显示命中数量，只保留定位行为
  dom.searchHint.textContent = '';
}

/* ── DSP / EQ ── */

function normalizeEqGains(list) {
  const src = Array.isArray(list) ? list : [];
  return EQ_BANDS.map((_, i) => {
    const n = Number(src[i]);
    return Number.isFinite(n) ? Math.min(12, Math.max(-12, n)) : 0;
  });
}

function drawEqCurve() {
  const canvas = dom.eqCurve;
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1A1D24';
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = 'rgba(42,46,56,0.9)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = (h * i) / 4;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }
  for (let i = 1; i < 5; i++) {
    const x = (w * i) / 5;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }

  const on = !!state.eqEnabled;
  const gains = normalizeEqGains(state.eqGains);
  const preDb = Number(state.eqPreampDb) || 0;
  const fMin = 20, fMax = 20000, mid = h / 2;
  const yScale = (h / 2) / 14;
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const f = fMin * Math.pow(fMax / fMin, x / (w - 1));
    let db = on ? preDb : 0;
    if (on) {
      for (let i = 0; i < EQ_BANDS.length; i++) {
        const b = EQ_BANDS[i];
        const oct = Math.log2(f / b.freq);
        const q = b.q || 1.1;
        if (b.type === 'peaking') db += gains[i] * Math.exp(-0.5 * Math.pow(oct * q * 1.4, 2));
        else if (b.type === 'lowshelf') db += gains[i] / (1 + Math.pow(f / b.freq, 4));
        else db += gains[i] / (1 + Math.pow(b.freq / f, 4));
      }
    }
    const y = mid - db * yScale;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = on ? 'rgba(61,219,217,0.95)' : 'rgba(139,144,154,0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = 'rgba(139,144,154,0.35)';
  ctx.fillRect(0, mid, w, 1);
}

function applyEqToGraph() {
  const on = !!state.eqEnabled;
  const gains = normalizeEqGains(state.eqGains);
  const preDb = Math.min(12, Math.max(-12, Number(state.eqPreampDb) || 0));
  const hp = Number(state.eqHpHz) || 0;
  const lp = Number(state.eqLpHz) || 0;
  if (eqPreamp) eqPreamp.gain.value = on ? Math.pow(10, preDb / 20) : 1;
  if (gainNode) gainNode.gain.value = 1;
  eqFilters.forEach((f, i) => {
    if (!f) return;
    f.gain.value = on ? gains[i] : 0;
  });
  if (eqHpFilter) {
    eqHpFilter.frequency.value = on && hp > 0 ? hp : 10;
  }
  if (eqLpFilter) {
    eqLpFilter.frequency.value = on && lp > 0 ? lp : 22050;
  }
  if (dom.btnEq) {
    dom.btnEq.classList.toggle('active', on);
    dom.btnEq.textContent = on ? 'EQ ON' : '均衡器';
  }
  updateEqStatus();
  drawEqCurve();
}

function updateEqStatus() {
  if (!dom.eqStatus) return;
  const on = state.eqEnabled ? 'ON' : 'OFF';
  const preset = state.eqPreset || 'FLAT';
  const pre = Number(state.eqPreampDb) || 0;
  const hp = Number(state.eqHpHz) || 0;
  const lp = Number(state.eqLpHz) || 0;
  const bits = [];
  if (pre) bits.push(`PRE ${pre > 0 ? '+' : ''}${pre}dB`);
  if (hp) bits.push(`HP ${hp}Hz`);
  if (lp) bits.push(`LP ${lp >= 1000 ? (lp / 1000) + 'k' : lp}Hz`);
  dom.eqStatus.textContent = `EQ: ${on} · ${preset} · 10-BAND` + (bits.length ? ` · ${bits.join(' / ')}` : '');
}

function renderEqBands() {
  if (!dom.eqBands) return;
  const gains = normalizeEqGains(state.eqGains);
  dom.eqBands.innerHTML = EQ_BANDS.map((b, i) => `
    <div class="eq-band" data-band="${i}">
      <div class="eq-db" id="eqDb${i}">${gains[i] > 0 ? '+' : ''}${gains[i] || 0}</div>
      <input type="range" min="-12" max="12" step="0.5" value="${gains[i]}" data-band="${i}" aria-label="${b.label}Hz" ${state.eqEnabled ? '' : 'disabled'} />
      <div class="eq-freq">${b.label}</div>
    </div>
  `).join('');

  if (dom.eqPreamp) {
    dom.eqPreamp.value = String(Number(state.eqPreampDb) || 0);
    dom.eqPreamp.disabled = !state.eqEnabled;
  }
  if (dom.eqPreampVal) {
    const pre = Number(state.eqPreampDb) || 0;
    dom.eqPreampVal.textContent = `${pre > 0 ? '+' : ''}${pre.toFixed(1)} dB`;
  }
  if (dom.eqHp) {
    dom.eqHp.value = String(Number(state.eqHpHz) || 0);
    dom.eqHp.disabled = !state.eqEnabled;
  }
  if (dom.eqLp) {
    dom.eqLp.value = String(Number(state.eqLpHz) || 0);
    dom.eqLp.disabled = !state.eqEnabled;
  }

  dom.eqBands.querySelectorAll('input[type="range"]').forEach((input) => {
    input.addEventListener('input', () => {
      const idx = Number(input.getAttribute('data-band'));
      const val = Number(input.value);
      state.eqGains = normalizeEqGains(state.eqGains.map((g, i) => (i === idx ? val : g)));
      state.eqPreset = 'CUSTOM';
      state.dspPreset = 'CUSTOM';
      if (dom.eqPresetSelect) dom.eqPresetSelect.value = 'CUSTOM';
      if (dom.btnDsp) {
        if (dom.btnDsp) dom.btnDsp.textContent = 'CUSTOM';
        dom.btnDsp.classList.add('active');
      }
      const db = el(`eqDb${idx}`);
      if (db) db.textContent = `${val > 0 ? '+' : ''}${val}`;
      resumeCtx();
      applyEqToGraph();
      persistSettingsFromForm();
    });
  });
  if (dom.eqPreamp) {
    dom.eqPreamp.oninput = () => {
      state.eqPreampDb = Number(dom.eqPreamp.value) || 0;
      if (dom.eqPreampVal) {
        const pre = state.eqPreampDb;
        dom.eqPreampVal.textContent = `${pre > 0 ? '+' : ''}${pre.toFixed(1)} dB`;
      }
      state.eqPreset = 'CUSTOM';
      resumeCtx();
      applyEqToGraph();
      persistSettingsFromForm();
    };
  }
  if (dom.eqHp) {
    dom.eqHp.onchange = () => {
      state.eqHpHz = Number(dom.eqHp.value) || 0;
      resumeCtx();
      applyEqToGraph();
      persistSettingsFromForm();
    };
  }
  if (dom.eqLp) {
    dom.eqLp.onchange = () => {
      state.eqLpHz = Number(dom.eqLp.value) || 0;
      resumeCtx();
      applyEqToGraph();
      persistSettingsFromForm();
    };
  }
  drawEqCurve();
}

function openEqPanel() {
  if (!dom.eqOverlay) return;
  resumeCtx();
  renderEqBands();
  syncDspUi();
  updateEqStatus();
  drawEqCurve();
  dom.eqOverlay.hidden = false;
}

function closeEqPanel() {
  if (!dom.eqOverlay) return;
  dom.eqOverlay.hidden = true;
}

function syncDspUi() {
  const key = DSP_PRESETS[state.eqPreset] ? state.eqPreset : 'FLAT';
  state.eqPreset = key;
  state.dspPreset = key;
  if (dom.btnDsp) {
    if (dom.btnDsp.tagName === 'SELECT') dom.btnDsp.value = key;
    else if (dom.btnDsp) dom.btnDsp.textContent = key;
    dom.btnDsp.classList.toggle('active', key !== 'FLAT');
  }
  if (dom.eqPresetSelect) dom.eqPresetSelect.value = key;
  if (dom.setDspPreset) dom.setDspPreset.value = key;
  if (dom.btnDsp) dom.btnDsp.textContent = key;
  if (dom.eqEnabled) dom.eqEnabled.checked = !!state.eqEnabled;
  if (dom.dspLine) {
    const tag = `${key}${state.eqEnabled ? ' · EQ' : ''}`;
    dom.dspLine.textContent = state.playing
      ? `DSP: 32-BIT FLOAT · ${tag} · ACTIVE`
      : `DSP: 32-BIT FLOAT · ${tag}`;
  }
}

function saveEqOnly() {
  const patch = {
    eqEnabled: !!state.eqEnabled,
    eqPreset: state.eqPreset || 'FLAT',
    dspPreset: state.dspPreset || state.eqPreset || 'FLAT',
    eqGains: normalizeEqGains(state.eqGains),
    eqPreampDb: Number(state.eqPreampDb) || 0,
    eqHpHz: Number(state.eqHpHz) || 0,
    eqLpHz: Number(state.eqLpHz) || 0,
  };
  const s = saveSettings(patch);
  return s;
}

function applyDspPreset(name) {
  const key = DSP_PRESETS[name] ? name : 'FLAT';
  state.eqPreset = key;
  state.dspPreset = key;
  if (key !== 'CUSTOM') {
    state.eqGains = DSP_PRESETS[key].slice();
    if (key === 'FLAT') {
      state.eqPreampDb = 0;
      state.eqHpHz = 0;
      state.eqLpHz = 0;
    }
  }
  if (!state.eqEnabled && key !== 'FLAT') state.eqEnabled = true;
  resumeCtx();
  applyEqToGraph();
  renderEqBands();
  syncDspUi();
  saveEqOnly();
}

function openConfirm(message, onOk) {
  if (!dom.confirmOverlay) {
    if (window.confirm(message)) onOk && onOk();
    return;
  }
  if (dom.confirmMessage) dom.confirmMessage.textContent = message;
  dom.confirmOverlay.hidden = false;
  dom.confirmOverlay._onOk = typeof onOk === 'function' ? onOk : null;
  dom.btnConfirmOk?.focus();
}

function closeConfirm() {
  if (!dom.confirmOverlay) return;
  dom.confirmOverlay.hidden = true;
  dom.confirmOverlay._onOk = null;
}

if (dom.confirmOverlay) {
  dom.confirmOverlay.addEventListener('click', (e) => {
    if (e.target === dom.confirmOverlay) closeConfirm();
  });
}
if (dom.btnConfirmCancel) {
  dom.btnConfirmCancel.addEventListener('click', closeConfirm);
}
if (dom.btnConfirmOk) {
  dom.btnConfirmOk.addEventListener('click', () => {
    const fn = dom.confirmOverlay?._onOk;
    closeConfirm();
    if (fn) fn();
  });
}

function openPlaylistSearch() {
  if (!dom.playlistSearchBar) return;
  dom.playlistSearchBar.hidden = false;
  if (dom.btnSearch) dom.btnSearch.classList.add('active');
  dom.playlistSearchInput?.focus();
  dom.playlistSearchInput?.select();
}

function closePlaylistSearch() {
  if (!dom.playlistSearchBar) return;
  state.searchQuery = '';
  if (dom.playlistSearchInput) dom.playlistSearchInput.value = '';
  dom.playlistSearchBar.hidden = true;
  if (dom.btnSearch) dom.btnSearch.classList.remove('active');
  updateSearchHint();
  renderPlaylist();
}

function locateSearchHit(direction = 0) {
  const hits = getSearchHitIndices();
  if (!hits.length) return -1;
  let target = hits[0];
  if (direction !== 0) {
    const cur = state.selectedIndex;
    const pos = hits.indexOf(cur);
    if (pos >= 0) target = hits[(pos + direction + hits.length) % hits.length];
    else target = hits[0];
  }
  setSingleSelection(target);
  renderPlaylist();
  scrollPlaylistToIndex(target);
  return target;
}

function applySearchQuery(q) {
  state.searchQuery = String(q || '');
  updateSearchHint();
  // 定位：列表始终完整显示，只高亮并跳到命中项
  renderPlaylist();
  if (!state.searchQuery.trim()) return;

  let hit = locateSearchHit(0);
  if (hit < 0 && hasDesktop && window.jt.readMeta) {
    const pending = state.tracks.filter((t) => t && !t.meta && t.path && !t.unsupported);
    mapLimit(pending.slice(0, 300), 4, (t) => enrichTrackFromDesktop(t, { withCover: false }))
      .then(() => {
        if (!state.searchQuery.trim()) return;
        if (getSearchHitIndices().length) {
          updateSearchHint();
          renderPlaylist();
          locateSearchHit(0);
        }
      })
      .catch(() => { /* ignore */ });
  }
}

function scrollPlaylistToIndex(index) {
  if (!dom.playlist || index < 0) return;
  const row = dom.playlist.querySelector(`.track-row[data-index="${index}"]`);
  if (!row) return;
  const box = dom.playlist;
  const offset = row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2;
  box.scrollTop = Math.max(0, offset);
}

/** 点击曲名：列表定位到当前播放歌曲 */
function locateCurrentPlayingTrack() {
  if (state.index < 0 || !state.tracks.length) return;
  const idx = state.index;
  const track = state.tracks[idx];
  if (state.searchQuery.trim() && track && !matchesSearch(track, state.searchQuery)) {
    state.searchQuery = '';
    if (dom.playlistSearchInput) dom.playlistSearchInput.value = '';
  }
  setSingleSelection(idx);
  renderPlaylist();
  scrollPlaylistToIndex(idx);
  if (dom.playlist) {
    dom.playlist.classList.remove('flash-playing');
    void dom.playlist.offsetWidth;
    dom.playlist.classList.add('flash-playing');
  }
}

if (dom.nowTitle) {
  dom.nowTitle.addEventListener('click', (e) => {
    e.stopPropagation();
    locateCurrentPlayingTrack();
  });
}
if (dom.nowCard) {
  dom.nowCard.addEventListener('click', locateCurrentPlayingTrack);
  dom.nowCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      locateCurrentPlayingTrack();
    }
  });
}
if (dom.statusNowPlaying) {
  dom.statusNowPlaying.addEventListener('click', locateCurrentPlayingTrack);
  dom.statusNowPlaying.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      locateCurrentPlayingTrack();
    }
  });
}

function renderPlaylist() {
  const hits = new Set(getSearchHitIndices());
  const filteringHighlight = hits.size > 0;
  dom.trackCount.textContent = String(state.tracks.length);
  dom.trackTotal.textContent = String(state.tracks.length).padStart(2, '0');
  updateSearchHint();
  dom.playlist.innerHTML = '';

  state.tracks.forEach((t, i) => {
    if (!t) return;
    const row = document.createElement('div');
    row.className = 'track-row';
    row.dataset.index = String(i);
    row.setAttribute('role', 'option');
    const isPlaying = i === state.index;
    const isSelected = isRowSelected(i);
    const isHit = filteringHighlight && hits.has(i);
    if (isPlaying) row.classList.add('playing');
    if (isHit) row.classList.add('search-hit');
    if (isSelected && !isPlaying) row.classList.add('selected');
    else if (isSelected && isPlaying) row.classList.add('selected-playing');
    if (t.unsupported) row.classList.add('bad');
    row.innerHTML = `
      <span class="t-num">${isPlaying && state.playing ? '▶' : String(i + 1).padStart(2, '0')}</span>
      <span class="t-title">${escapeHtml(t.meta?.title || t.name)}</span>
      <span class="t-artist">${escapeHtml(t.meta?.artist || '—')}</span>
      <span class="t-dur">${t.duration ? fmtTime(t.duration) : '--:--'}</span>`;
    row.addEventListener('dblclick', () => {
      setSingleSelection(i);
      playIndex(i);
    });
    row.addEventListener('click', (e) => {
      if (e.ctrlKey || e.metaKey) toggleSelection(i);
      else if (e.shiftKey) selectRange(i);
      else setSingleSelection(i);
      renderPlaylist();
    });
    row.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      if (!isRowSelected(i)) setSingleSelection(i);
      renderPlaylist();
      showPlaylistMenu(e.clientX, e.clientY);
    });
    dom.playlist.appendChild(row);
  });
}

function updateNowUI() {
  const track = state.tracks[state.index];
  if (!track) {
    dom.nowTitle.textContent = '未选择曲目';
    dom.nowArtist.textContent = '—';
    dom.statusNowPlaying.textContent = '正在播放：未选择曲目';
    dom.trackIndex.textContent = '00';
    setCover(null);
    clearLyricsState();
    setLyricsFallback(null);
    setMeta(null);
    refreshPlayTimeDisplay(0);
    dom.timeTotal.textContent = '00:00';
    return;
  }

  const meta = track.meta || {};
  const title = meta.title || track.name;
  const artist = meta.artist || '未知艺术家';
  dom.nowTitle.textContent = title;
  dom.nowArtist.textContent = artist;
  dom.statusNowPlaying.textContent = `正在播放：${title} - ${artist}`;
  dom.trackIndex.textContent = String(state.index + 1).padStart(2, '0');
  setCover(meta.cover, title);
  setMeta(track);
  if (state.lyrics.trackId !== track.id) {
    setLyricsFallback(track);
    loadTrackLyrics(track);
  } else if (state.lyrics.timed?.length || state.lyrics.plain?.length) {
    renderLyricsView(true);
  } else {
    setLyricsFallback(track);
  }
  if (track.duration) dom.timeTotal.textContent = fmtTime(track.duration);
  refreshPlayTimeDisplay(audio.currentTime || 0);
}

async function extractPeaks(track) {
  if (!audioCtx) return null;
  let buf = null;
  try {
    if (hasDesktop && track.path && window.jt.readBuffer) {
      buf = await window.jt.readBuffer(track.path);
    } else if (track.url) {
      const res = await fetch(track.url);
      buf = await res.arrayBuffer();
    }
    if (!buf || buf.byteLength > DECODE_MAX_BYTES) return null;
    const copy = buf.slice ? buf.slice(0) : buf;
    buf = null; // 允许回收原始缓冲
    const audioBuf = await audioCtx.decodeAudioData(copy);
    const ch = audioBuf.getChannelData(0);
    const target = 480;
    const block = Math.max(1, Math.floor(ch.length / target));
    const peaks = new Float32Array(target);
    for (let i = 0; i < target; i++) {
      let max = 0;
      const start = i * block;
      const end = Math.min(start + block, ch.length);
      for (let j = start; j < end; j += 4) {
        const v = Math.abs(ch[j]);
        if (v > max) max = v;
      }
      peaks[i] = max;
    }
    return peaks;
  } catch {
    return null;
  }
}

/** 批量读列表：不带封面，限制并发 */
async function mapLimit(list, limit, worker) {
  const out = new Array(list.length);
  let i = 0;
  async function run() {
    while (i < list.length) {
      const idx = i++;
      out[idx] = await worker(list[idx], idx);
    }
  }
  const n = Math.max(1, Math.min(limit, list.length || 1));
  await Promise.all(Array.from({ length: n }, run));
  return out;
}

async function enrichTrackFromDesktop(track, options = {}) {
  if (!hasDesktop || !track.path) return;
  const wantCover = !!options.withCover;
  if (!track.meta || !track.url || (wantCover && !track.meta.cover)) {
    try {
      const res = await window.jt.readMeta(track.path, {
        includeCover: wantCover,
        includeLyrics: options.withLyrics !== false,
      });
      if (res.ok) {
        track.meta = { ...(track.meta || {}), ...res.data };
        if (!res.data.cover && track.meta.cover && !wantCover) {
          // 批量模式下不保留旧封面大图
          delete track.meta.cover;
        }
        track.url = res.url;
        if (res.data.duration) track.duration = res.data.duration;
      }
    } catch {
      /* ignore */
    }
  }
  if (track.meta?.lyrics && state.tracks[state.index]?.id === track.id && !state.lyrics.timed && !state.lyrics.plain) {
    applyLyricsPayload(track.id, track.meta.lyrics, track.meta.lyricsSource || 'embedded');
  } else if (state.tracks[state.index]?.id === track.id && !state.lyrics.timed && !state.lyrics.plain) {
    loadTrackLyrics(track);
  }
}

function syntheticPeaks(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) h = (h * 31 + seedStr.charCodeAt(i)) >>> 0;
  const n = 480;
  const peaks = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const env = 0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.05));
    const a = Math.abs(Math.sin(h + i * 0.37) * Math.cos(h * 0.001 + i * 0.11));
    const b = Math.abs(Math.sin(i * 1.7 + h * 0.0001));
    peaks[i] = Math.min(1, env * (0.35 + 0.65 * (a * 0.6 + b * 0.4)));
  }
  return peaks;
}

async function loadTrack(i, autoplay = true, options = {}) {
  if (!state.tracks.length) return;
  if (i < 0 || i >= state.tracks.length) return;

  const opts = options || {};
  const explicitResume = Number(opts.resumeAt) || 0;

  state.index = i;
  setSingleSelection(i);
  const track = state.tracks[i];
  renderPlaylist();
  updateNowUI();

  if (track.unsupported) {
    setEngine(false);
    dom.statusNowPlaying.textContent = `无法播放：${track.name}`;
    if (autoplay) {
      const next = findNextIndex(i, true);
      if (next !== -1) loadTrack(next, true);
    }
    return;
  }

  resumeCtx();
  state.wavePeaks = null;
  state.lastPeaks = null;
  state.lyrics.index = -1;
  track.blobTried = false;

  // 进度：优先用调用方指定；否则查本曲已保存进度；手动切歌默认从头
  let resumeAt = explicitResume;
  if (!resumeAt && opts.useSavedPosition && track.path) {
    resumeAt = Number(state.trackPositions?.[pathKeyOf(track.path)]) || 0;
  }
  if (!resumeAt && opts.useSavedPosition) {
    resumeAt = Number(state.resumePosition) || 0;
  }
  state.resumePosition = resumeAt > 0 ? resumeAt : 0;
  state.resumePath = track.path || state.resumePath;

  if (state.lyrics.trackId !== track.id) {
    clearLyricsState();
    state.lyrics.trackId = track.id;
    setLyricsFallback(track);
  }

  let src = track.url;
  if (!src && track.path && hasDesktop) {
    const res = await window.jt.readMeta(track.path, { includeCover: !isVideoName(track.name) });
    if (res.ok) {
      track.url = res.url;
      track.meta = { ...(track.meta || {}), ...res.data };
      track.duration = res.data.duration || track.duration || 0;
      src = track.url;
      updateNowUI();
      renderPlaylist();
    }
  } else if (track.path && hasDesktop && track.meta && !track.meta.cover && !isVideoName(track.name)) {
    try {
      if (window.jt.readCover) {
        const cover = await window.jt.readCover(track.path);
        if (cover) track.meta.cover = cover;
      }
    } catch { /* ignore */ }
  }

  for (const t of state.tracks) {
    if (t !== track && t.meta && t.meta.cover) {
      delete t.meta.cover;
    }
  }

  if (!src && track.file) {
    if (track.url) URL.revokeObjectURL(track.url);
    track.url = URL.createObjectURL(track.file);
    src = track.url;
  }

  if (!src) {
    dom.statusNowPlaying.textContent = `无法读取：${track.name}`;
    return;
  }

  // 视频：中间区域显示画面；音频：封面+歌词
  state.videoMode = isVideoName(track.name) || /\.(mp4|m4v|webm|mov)$/i.test(src);
  applyStageMode();
  applyLyricBackground();

  const el = media();
  const other = el === audio ? video : audio;
  if (other && other.src) {
    try { other.pause(); } catch { /* ignore */ }
  }
  el.src = src;
  el.load();
  applyVolume();
  loadTrackLyrics(track);

  // 始终使用轻量合成波形；全曲 decodeAudioData 会在播放后半段挤占内存导致中断
  state.wavePeaks = syntheticPeaks(track.path || track.name || src);

  // 元数据就绪后再定位，避免从头播
  const ready = await waitAudioReady(5000);
  if (ready && resumeAt > 0) {
    await seekToResumePosition(resumeAt);
  }

  const mel = media();
  if (autoplay) {
    try {
      if (resumeAt > 0 && Math.abs((mel.currentTime || 0) - Math.min(resumeAt, (mel.duration || resumeAt))) > 1.5) {
        await seekToResumePosition(resumeAt);
      }
      await mel.play();
      if (resumeAt > 0 && Math.abs((mel.currentTime || 0) - Math.min(resumeAt, (mel.duration || resumeAt))) > 1.5) {
        await seekToResumePosition(resumeAt);
      }
      setEngine(true);
      persistPlaybackProgress(true);
    } catch (err) {
      console.warn('play failed', err);
      setEngine(false);
    }
  } else {
    syncEngineFromAudio();
    if (resumeAt > 0) refreshPlayTimeDisplay(mel.currentTime || resumeAt);
  }

  // 从头播时歌词区强制回到第一句
  if (!resumeAt || (mel.currentTime || 0) < 1) {
    if (state.lyrics.timed?.length || state.lyrics.plain?.length) {
      state.lyrics.index = findLyricIndex(state.lyrics.timed || [], mel.currentTime || 0);
      renderLyricsView(true);
    }
  }

  drawWave();
  if (!state.restoring) persistAppState(true);
}

function findNextIndex(from, force = false) {
  if (!state.tracks.length) return -1;
  if (state.repeat === 'one' && !force) return from;
  if (state.repeat === 'shuffle' || state.shuffle) {
    if (state.tracks.length === 1) return 0;
    let n = from;
    while (n === from) n = Math.floor(Math.random() * state.tracks.length);
    return n;
  }
  // 列表循环：播完最后一首回到第一首
  const next = from + 1;
  return next < state.tracks.length ? next : 0;
}

function findPrevIndex(from) {
  if (!state.tracks.length) return -1;
  if (state.repeat === 'shuffle' || state.shuffle) {
    return Math.floor(Math.random() * state.tracks.length);
  }
  const prev = from - 1;
  return prev >= 0 ? prev : state.tracks.length - 1;
}

function playIndex(i) {
  loadTrack(i, true);
}

function togglePlay() {
  if (state.index < 0 && state.tracks.length) {
    playIndex(0);
    return;
  }
  const mel = media();
  if (!mel.src) return;
  resumeCtx();
  if (mel.paused) {
    mel.play().then(() => setEngine(true)).catch(() => setEngine(false));
  } else {
    mel.pause();
    setEngine(false);
  }
}

function focusNewTracks(firstIndex, trackId) {
  if (!Number.isInteger(firstIndex) || firstIndex < 0 || firstIndex >= state.tracks.length) return;
  setSingleSelection(firstIndex);
  if (state.searchQuery && !matchesSearch(state.tracks[firstIndex], state.searchQuery)) {
    // 添加时若正在搜索，清掉搜索条件，避免新歌被藏在高亮外
    state.searchQuery = '';
    if (dom.playlistSearchInput) dom.playlistSearchInput.value = '';
  }
  renderPlaylist();
  const row = dom.playlist.querySelector(`.track-row[data-index="${firstIndex}"]`) ||
    dom.playlist.children[firstIndex];
  if (row) {
    const box = dom.playlist;
    const offset = row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2;
    box.scrollTop = Math.max(0, offset);
  } else {
    scrollPlaylistToIndex(firstIndex);
  }
  // 元数据读完后列表若重排，仍按 id 滚到该曲
  if (trackId) {
    setTimeout(() => {
      const idx = state.tracks.findIndex((t) => t.id === trackId);
      if (idx >= 0) scrollPlaylistToIndex(idx);
    }, 400);
  }
}

async function addPaths(paths, options = {}) {
  const autoplay = options.autoplay !== false;
  const added = [];
  const existingKeys = new Set();
  for (const t of state.tracks) {
    for (const k of trackIdentityKeys(t)) existingKeys.add(k);
  }

  for (const p of paths) {
    const name = p.split(/[\\/]/).pop();
    const pathKey = 'p:' + String(p).replace(/\\/g, '/').toLowerCase().trim();
    const baseKey = 'n:' + String(name || '').toLowerCase().trim();
    if (existingKeys.has(pathKey)) continue;
    const track = AUDIO_EXT.test(name)
      ? {
          id: crypto.randomUUID(),
          name,
          path: p,
          url: null,
          duration: 0,
          unsupported: false,
          meta: null,
        }
      : {
          id: crypto.randomUUID(),
          name,
          path: p,
          url: null,
          duration: 0,
          unsupported: true,
          meta: { title: name, artist: '—', album: '—', format: name.split('.').pop()?.toUpperCase() },
        };
    existingKeys.add(pathKey);
    if (baseKey) existingKeys.add(baseKey);
    added.push(track);
  }

  if (!added.length) {
    renderPlaylist();
    return;
  }

  const firstNewIndex = state.tracks.length;
  const firstNewId = added[0]?.id;
  state.tracks.push(...added);
  renderPlaylist();

  // 自动跳到刚添加的第一首（恢复启动时 options.selectFirst:false 则只滚不抢选中）
  if (options.scrollToNew !== false) {
    if (options.selectFirst === false) {
      const row = dom.playlist.querySelector(`.track-row[data-index="${firstNewIndex}"]`);
      if (row) {
        const box = dom.playlist;
        box.scrollTop = Math.max(0, row.offsetTop - box.clientHeight / 2 + row.clientHeight / 2);
      }
    } else {
      focusNewTracks(firstNewIndex, firstNewId);
    }
  }

  persistAppState();

  // enrich in background：不加载封面，限制并发
  const enrichAll = mapLimit(added, 4, async (t) => {
    if (!t.unsupported) await enrichTrackFromDesktop(t, { withCover: false });
    return t;
  });
  Promise.all(enrichAll).then(() => {
    dedupePlaylistInPlace();
    if (state.tracks[state.index]?.id) updateNowUI();
    renderPlaylist();
    if (options.scrollToNew !== false && firstNewId) {
      const idx = state.tracks.findIndex((t) => t.id === firstNewId);
      if (idx >= 0) scrollPlaylistToIndex(idx);
    }
    persistAppState(true);
  });

  const wantAuto = autoplay && (options.autoplay !== false) && state.autoplayAfterAdd !== false;
  if (wantAuto && state.index < 0 && state.tracks.length) {
    const startFrom = firstNewIndex < state.tracks.length ? firstNewIndex : 0;
    let firstPlayable = -1;
    for (let i = startFrom; i < state.tracks.length; i++) {
      if (!state.tracks[i]?.unsupported) { firstPlayable = i; break; }
    }
    if (firstPlayable < 0) {
      firstPlayable = state.tracks.findIndex((t) => !t.unsupported);
    }
    if (firstPlayable >= 0) {
      await enrichTrackFromDesktop(state.tracks[firstPlayable], { withCover: true });
      playIndex(firstPlayable);
    }
  } else if (!wantAuto && options.selectFirst !== false && options.scrollToNew !== false) {
    focusNewTracks(firstNewIndex, firstNewId);
  }

  persistAppState(true);
}

async function addBrowserFiles(fileList) {
  const files = [...fileList].filter((f) => f.name && !f.name.startsWith('.'));
  const existingKeys = new Set();
  for (const t of state.tracks) {
    for (const k of trackIdentityKeys(t)) existingKeys.add(k);
  }
  const items = [];
  for (const f of files) {
    const supported = AUDIO_EXT.test(f.name) || (f.type && f.type.startsWith('audio/'));
    const name = f.name;
    const nameKey = 'n:' + String(name).toLowerCase().trim();
    const titleKey = `t:${String(name).toLowerCase().trim()}|local文件||0`;
    if (existingKeys.has(nameKey)) continue;
    const item = {
      id: crypto.randomUUID(),
      name,
      path: null,
      file: f,
      url: URL.createObjectURL(f),
      duration: 0,
      unsupported: !supported,
      meta: {
        title: name.replace(/\.[^.]+$/, ''),
        artist: '本地文件',
        album: '—',
        format: (name.split('.').pop() || 'AUDIO').toUpperCase(),
      },
    };
    existingKeys.add(nameKey);
    existingKeys.add(titleKey);
    items.push(item);
  }
  if (!items.length) return;

  const firstNewIndex = state.tracks.length;
  const firstNewId = items[0]?.id;
  state.tracks.push(...items);
  renderPlaylist();
  focusNewTracks(firstNewIndex, firstNewId);
  persistAppState(true);
  if (state.index < 0) {
    const startFrom = firstNewIndex < state.tracks.length ? firstNewIndex : 0;
    let firstPlayable = -1;
    for (let i = startFrom; i < state.tracks.length; i++) {
      if (!state.tracks[i]?.unsupported) { firstPlayable = i; break; }
    }
    if (firstPlayable >= 0) playIndex(firstPlayable);
  }
}

function clearPlaylist() {
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  state.tracks.forEach((t) => {
    if (t.url && t.url.startsWith('blob:')) URL.revokeObjectURL(t.url);
  });
  state.tracks = [];
  state.index = -1;
  state.selectedIndex = -1;
  state.selectedSet = new Set();
  state.selectionAnchor = -1;
  state.wavePeaks = null;
  setEngine(false);
  renderPlaylist();
  updateNowUI();
  drawWave();
  drawRta(true);
  updateViz(0, 0);
  persistAppState(true);
}

function hidePlaylistMenu() {
  if (!dom.playlistMenu) return;
  dom.playlistMenu.hidden = true;
}

function showPlaylistMenu(x, y) {
  if (!dom.playlistMenu) return;
  dom.playlistMenu.hidden = false;
  const w = dom.playlistMenu.offsetWidth || 140;
  const h = dom.playlistMenu.offsetHeight || 90;
  const left = Math.min(x, window.innerWidth - w - 8);
  const top = Math.min(y, window.innerHeight - h - 8);
  dom.playlistMenu.style.left = `${Math.max(8, left)}px`;
  dom.playlistMenu.style.top = `${Math.max(8, top)}px`;
}

function removeTrackAt(index) {
  if (index < 0 || index >= state.tracks.length) return false;
  const removingPlaying = index === state.index;
  const track = state.tracks[index];

  if (track?.url && String(track.url).startsWith('blob:')) {
    URL.revokeObjectURL(track.url);
  }

  state.tracks.splice(index, 1);

  if (!state.tracks.length) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.index = -1;
    state.selectedIndex = -1;
    state.wavePeaks = null;
    clearLyricsState();
    setEngine(false);
    renderPlaylist();
    updateNowUI();
    drawWave();
    persistAppState(true);
    return true;
  }

  if (removingPlaying) {
    const nextIndex = Math.min(index, state.tracks.length - 1);
    state.index = -1;
    state.selectedIndex = nextIndex;
    renderPlaylist();
    loadTrack(nextIndex, true);
    persistAppState(true);
    return true;
  }

  if (state.index > index) state.index -= 1;
  if (state.selectedIndex > index) state.selectedIndex -= 1;
  else if (state.selectedIndex === index) {
    state.selectedIndex = Math.min(index, state.tracks.length - 1);
  }

  renderPlaylist();
  persistAppState(true);
  return true;
}

function removeSelectedTrack() {
  const indices = getSelectedIndices();
  if (!indices.length) {
    const fallback = state.index;
    if (fallback >= 0) removeTrackAt(fallback);
    else dom.statusNowPlaying.textContent = '请先在列表中选中要删除的歌曲';
    return;
  }
  removeTracksAt(indices);
}

function removeTracksAt(indices) {
  const list = [...new Set(indices)].filter((i) => i >= 0 && i < state.tracks.length).sort((a, b) => b - a);
  if (!list.length) return;

  const playingIn = list.includes(state.index);
  const earliestRemoved = Math.min(...list);

  for (const idx of list) {
    const track = state.tracks[idx];
    if (track?.url && String(track.url).startsWith('blob:')) {
      URL.revokeObjectURL(track.url);
    }
    state.tracks.splice(idx, 1);
  }

  if (!state.tracks.length) {
    audio.pause();
    audio.removeAttribute('src');
    audio.load();
    state.index = -1;
    state.selectedIndex = -1;
    state.selectedSet = new Set();
    state.selectionAnchor = -1;
    state.wavePeaks = null;
    clearLyricsState();
    setEngine(false);
    renderPlaylist();
    updateNowUI();
    drawWave();
    persistAppState(true);
    return;
  }

  remapSelectionAfterRemove(list);

  if (playingIn) {
    const nextIndex = Math.min(earliestRemoved, state.tracks.length - 1);
    state.index = -1;
    setSingleSelection(nextIndex);
    renderPlaylist();
    loadTrack(nextIndex, true);
    persistAppState(true);
    return;
  }

  if (state.index >= 0) {
    let shift = 0;
    for (const r of list) if (r < state.index) shift += 1;
    state.index = Math.max(0, state.index - shift);
  }

  renderPlaylist();
  persistAppState(true);
}

function updateRepeatBtn() {
  const map = {
    all: '列表循环',
    one: '单曲循环',
    shuffle: '随机',
    off: '列表循环',
  };
  const mode = (state.repeat === 'one' || state.repeat === 'shuffle') ? state.repeat : 'all';
  state.repeat = mode;
  if (dom.btnRepeat) {
    const label = map[mode] || '列表循环';
    dom.btnRepeat.title = `循环模式：${label}（点击切换）`;
    dom.btnRepeat.setAttribute('aria-label', label);
    dom.btnRepeat.dataset.mode = mode;
    // 只切换图标，不改变按钮颜色
    dom.btnRepeat.classList.remove('active');
  }
  state.shuffle = mode === 'shuffle';
}

/* ── Visualization ── */

function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.floor(rect.width * dpr));
  const h = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  return { w, h, dpr };
}

function drawWave() {
  const canvas = dom.waveCanvas;
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#1A1D24';
  ctx.fillRect(0, 0, w, h);

  // grid
  ctx.strokeStyle = 'rgba(42,46,56,0.9)';
  ctx.lineWidth = 1;
  for (let i = 1; i < 8; i++) {
    const x = (w * i) / 8;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, h / 2);
  ctx.lineTo(w, h / 2);
  ctx.stroke();

  const peaks = state.wavePeaks || syntheticPeaks('idle');
  const em = media();
  const duration = em.duration || state.tracks[state.index]?.duration || 0;
  const progress = duration
    ? Math.min(1, Math.max(0, (em.currentTime || 0) / duration))
    : 0;
  const mid = h / 2;
  const barCount = peaks.length;
  const gap = 1;
  const barW = Math.max(1, w / barCount - gap);

  for (let i = 0; i < barCount; i++) {
    const x = i * (w / barCount);
    const t = i / barCount;
    const amp = peaks[i] * (h * 0.42);
    const played = t <= progress;
    const top = mid - amp * (0.75 + 0.25 * Math.sin(i));
    const bot = mid + amp * (0.65 + 0.2 * Math.cos(i));
    if (played) {
      ctx.fillStyle = 'rgba(61, 219, 217, 0.9)';
    } else {
      ctx.fillStyle = 'rgba(236, 234, 230, 0.28)';
    }
    ctx.fillRect(x, top, barW, Math.max(1, bot - top));
  }

  // playhead
  const px = progress * w;
  ctx.fillStyle = state.seeking ? '#ffffff' : '#3DDBD9';
  ctx.fillRect(Math.min(px, Math.max(0, w - 2)), 0, 2, h);

  // peak markers
  ctx.fillStyle = 'rgba(212,43,58,0.7)';
  for (let i = 0; i < barCount; i += 12) {
    if (peaks[i] > 0.85) {
      const x = i * (w / barCount);
      ctx.fillRect(x, mid - 2, barW, 4);
    }
  }
}

function drawRta(forceIdle = false) {
  const canvas = dom.rtaCanvas;
  if (!canvas) return;
  const { w, h } = resizeCanvas(canvas);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#1A1D24';
  ctx.fillRect(0, 0, w, h);

  const bars = state.rtaBars;
  const n = bars.length;
  const dpr = window.devicePixelRatio || 1;
  const gap = 2 * dpr;
  const barW = (w - gap * (n + 1)) / n;
  const baseY = h - 4 * dpr;

  for (let i = 0; i < n; i++) {
    const v = forceIdle ? Math.max(0.04, 0.12 * Math.sin(i * 0.7)) : bars[i];
    const bh = Math.max(2 * dpr, v * (h - 10 * dpr));
    const x = gap + i * (barW + gap);
    const grad = ctx.createLinearGradient(0, baseY, 0, baseY - bh);
    grad.addColorStop(0, '#3DDBD9');
    grad.addColorStop(0.65, '#D4A84B');
    grad.addColorStop(1, '#D42B3A');
    ctx.fillStyle = grad;
    ctx.fillRect(x, baseY - bh, barW, bh);
    ctx.fillStyle = 'rgba(236,234,230,0.55)';
    ctx.fillRect(x, baseY - bh - 2 * dpr, barW, 2 * dpr);
  }
  ctx.fillStyle = 'rgba(139,144,154,0.45)';
  ctx.fillRect(0, baseY, w, 1);
}

/** 歌词区背景：PC Sound Spectrum —— 对齐参考视频「底部矮条 + 小黄格」 */
const LYRIC_BG_HZ = [
  '32', '64', '96', '128', '160', '192', '256', '320',
  '384', '448', '512', '576', '704', '768', '832', '960',
  '1k', '1.2k', '1.6k', '2k', '2.5k', '3k', '4k', '5k',
  '6k', '8k', '10k', '12k', '16k', '18k', '20k',
];

function drawLyricBgSpectrum(forceIdle = false) {
  const canvas = dom.lyricBgCanvas;
  if (!canvas || state.videoMode) return;
  if (state.bgSpectrum === false) return;
  if (canvas.classList.contains('hidden')) return;
  const { w, h } = resizeCanvas(canvas);
  if (!w || !h) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, w, h);
  const dpr = window.devicePixelRatio || 1;

  // 格子宽扁 + 贴底排版
  const labelH = Math.max(12, 12 * dpr);
  const cellW = Math.max(6, Math.round(10 * dpr));
  const cellH = Math.max(3, Math.round(4 * dpr));
  const gapX = Math.max(1, Math.round(1 * dpr));
  const gapY = Math.max(1, Math.round(1 * dpr));
  const maxStack = 5;
  const stackH = maxStack * cellH + (maxStack - 1) * gapY;
  // 条带+刻度整体贴 canvas 底边
  const labelY = h - 3 * dpr;
  const stripTop = Math.max(0, labelY - labelH - stackH);
  const cols = Math.max(12, Math.floor((w - 4 * dpr) / (cellW + gapX)));

  const bars = state.rtaBars;
  const n = bars.length;
  if (!state.lyricBgPeaks || state.lyricBgPeaks.length < cols) {
    state.lyricBgPeaks = new Float32Array(Math.max(cols, n));
  }
  const peaks = state.lyricBgPeaks;

  for (let i = 0; i < cols; i++) {
    // 将 32 段 RTA 连续插值到整条宽度，避免 i % n 导致 32-384 / 1k-6k… 分段重复
    const t = cols <= 1 ? 0 : (i / (cols - 1)) * (n - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(n - 1, i0 + 1);
    const frac = t - i0;
    const src = (bars[i0] || 0) * (1 - frac) + (bars[i1] || 0) * frac;
    const raw = forceIdle
      ? Math.max(0.05, 0.35 * Math.abs(Math.sin(performance.now() / 220 + i * 0.25)))
      : src;
    const v = Math.min(1, raw * 1.6);
    const lit = Math.round(v * maxStack);
    peaks[i] = v >= peaks[i] ? v : Math.max(v, peaks[i] - 0.05);
    const peakLit = Math.round(peaks[i] * maxStack);
    const x = 2 * dpr + i * (cellW + gapX);

    for (let s = 0; s < maxStack; s++) {
      const y = stripTop + (maxStack - 1 - s) * (cellH + gapY);
      const on = s < lit;
      const isPeak = peakLit === s + 1 && peakLit > lit;
      if (on) {
        ctx.fillStyle = '#F2E14C';
        ctx.fillRect(x, y, cellW, cellH);
      }
      if (isPeak) {
        ctx.fillStyle = 'rgba(255,255,230,0.95)';
        ctx.fillRect(x, y, cellW, cellH);
      }
    }
  }

  // 刻度铺满整条宽度：32Hz → 20k 必须画到最右
  ctx.font = `${Math.max(7, Math.round(7 * dpr))}px Consolas, monospace`;
  ctx.fillStyle = '#3DDBD9';
  const padL = 12 * dpr;
  const padR = 18 * dpr;
  const nLab = LYRIC_BG_HZ.length;
  for (let i = 0; i < nLab; i++) {
    const t = LYRIC_BG_HZ[i];
    const x = padL + (i / (nLab - 1)) * (w - padL - padR);
    ctx.textAlign = i === 0 ? 'left' : i === nLab - 1 ? 'right' : 'center';
    ctx.fillText(t, i === 0 ? padL * 0.4 : i === nLab - 1 ? w - 2 * dpr : x, labelY);
  }
}

function levelsFromAnalyser(analyser, data) {
  if (!analyser) return 0;
  analyser.getByteTimeDomainData(data);
  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const v = (data[i] - 128) / 128;
    sum += v * v;
  }
  return Math.sqrt(sum / data.length);
}

function updateViz(levelL, levelR) {
  const normL = Math.min(1, levelL * 3.2);
  const normR = Math.min(1, levelR * 3.2);
  state.smoothLevels.l = state.smoothLevels.l * 0.7 + normL * 0.3;
  state.smoothLevels.r = state.smoothLevels.r * 0.7 + normR * 0.3;

  const pL = state.smoothLevels.l * 100;
  const pR = state.smoothLevels.r * 100;
  dom.vuL.style.width = `${pL}%`;
  dom.vuR.style.width = `${pR}%`;
  dom.vuLDb.textContent = fmtDb(levelL);
  dom.vuRDb.textContent = fmtDb(levelR);

  // needles: -60deg at 0, +60deg at 1
  const angle = (norm) => -60 + norm * 120;
  setNeedle(dom.needleL, state.smoothLevels.l);
  setNeedle(dom.needleR, state.smoothLevels.r);

  function setNeedle(needle, norm) {
    if (!needle) return;
    const a = (angle(norm) * Math.PI) / 180;
    const cx = 80, cy = 78, len = 50;
    const x2 = cx + Math.sin(a) * len;
    const y2 = cy - Math.cos(a) * len;
    needle.setAttribute('x2', String(x2));
    needle.setAttribute('y2', String(y2));
  }
}

let freqData = null;
let tdL = null;
let tdR = null;

function tick() {
  // 窗口隐藏/托盘时跳过绘制，降低后台 CPU（不影响音频）
  if (typeof document !== 'undefined' && document.hidden) {
    requestAnimationFrame(tick);
    return;
  }
  if (masterAnalyser) {
    if (!freqData) freqData = new Uint8Array(masterAnalyser.frequencyBinCount);
    masterAnalyser.getByteFrequencyData(freqData);
    const n = 32;
    for (let i = 0; i < n; i++) {
      // logarithmic-ish mapping
      const start = Math.floor(Math.pow(i / n, 1.5) * (freqData.length - 1));
      const end = Math.max(start + 1, Math.floor(Math.pow((i + 1) / n, 1.5) * (freqData.length - 1)));
      let sum = 0;
      for (let j = start; j < end; j++) sum += freqData[j];
      const avg = sum / Math.max(1, end - start) / 255;
      state.rtaBars[i] = state.rtaBars[i] * 0.72 + avg * 0.28;
    }
    drawRta();
    drawLyricBgSpectrum(false);

    if (!tdL) {
      tdL = new Uint8Array(analyserL.fftSize);
      tdR = new Uint8Array(analyserR.fftSize);
    }
    const l = levelsFromAnalyser(analyserL, tdL);
    const r = levelsFromAnalyser(analyserR, tdR);
    updateViz(l, r);
  } else {
    if (state.playing) {
      // soft idle motion when graph not ready
      updateViz(0.05 + Math.random() * 0.02, 0.04 + Math.random() * 0.02);
    } else {
      updateViz(0, 0);
      drawRta(true);
      drawLyricBgSpectrum(true);
    }
  }

  // time + lyrics UI
  const mel = media();
  if (!state.seeking && mel.duration) {
    const t = mel.currentTime;
    refreshPlayTimeDisplay(t);
    dom.timeTotal.textContent = fmtTime(mel.duration);
    dom.seekBar.value = String(Math.floor((t / mel.duration) * 1000));
    if (!state.videoMode) syncLyrics(t);
  } else if (!state.seeking) {
    if (!state.videoMode) syncLyrics(mel.currentTime || 0);
  }
  if (!state.restoring && state.playing && mel.currentTime > 0.8) {
    state.resumePosition = mel.currentTime;
    const tr = state.index >= 0 ? state.tracks[state.index] : null;
    if (tr?.path) {
      state.trackPositions = state.trackPositions || {};
      state.trackPositions[pathKeyOf(tr.path)] = mel.currentTime;
    }
    persistPlaybackProgress(false);
  }
  drawWave();
  requestAnimationFrame(tick);
}

/* ── Events ── */

audio.addEventListener('ended', () => {
  const next = findNextIndex(state.index);
  if (next === -1) {
    setEngine(false);
    return;
  }
  loadTrack(next, true);
});

audio.addEventListener('loadedmetadata', () => {
  if (state.index >= 0 && audio.duration) {
    state.tracks[state.index].duration = audio.duration;
    dom.timeTotal.textContent = fmtTime(audio.duration);
    refreshPlayTimeDisplay(audio.currentTime || 0);
    renderPlaylist();
  }
});

// 播放进度落盘
audio.addEventListener('timeupdate', () => {
  if (state.restoring) return;
  if (!audio.src || audio.paused) return;
  if (state.index < 0) return;
  state.resumePosition = audio.currentTime || 0;
  const track = state.tracks[state.index];
  if (track?.path && state.resumePosition > 0.8) {
    state.trackPositions = state.trackPositions || {};
    state.trackPositions[pathKeyOf(track.path)] = state.resumePosition;
  }
  persistPlaybackProgress(false);
});
audio.addEventListener('pause', () => {
  if (state.restoring) return;
  state.resumePosition = audio.currentTime || state.resumePosition || 0;
  const track = state.index >= 0 ? state.tracks[state.index] : null;
  if (track?.path && state.resumePosition > 0.8) {
    state.trackPositions = state.trackPositions || {};
    state.trackPositions[pathKeyOf(track.path)] = state.resumePosition;
  }
  persistAppState(true);
});
audio.addEventListener('seeked', () => {
  if (state.restoring) return;
  state.resumePosition = audio.currentTime || 0;
  const track = state.index >= 0 ? state.tracks[state.index] : null;
  if (track?.path && state.resumePosition > 0.8) {
    state.trackPositions = state.trackPositions || {};
    state.trackPositions[pathKeyOf(track.path)] = state.resumePosition;
  }
  // 拖进度后重算歌词窗口，避免开头/当前句错位
  syncLyrics(audio.currentTime || 0, true);
  persistPlaybackProgress(true);
});

function mimeForAudioName(name = '') {
  const n = String(name).toLowerCase();
  if (n.endsWith('.mp4') || n.endsWith('.m4v') || n.endsWith('.mov')) return 'video/mp4';
  if (n.endsWith('.m4a')) return 'audio/mp4';
  if (n.endsWith('.webm')) return 'video/webm';
  if (n.endsWith('.mkv')) return 'video/x-matroska';
  if (n.endsWith('.aac')) return 'audio/aac';
  return 'video/mp4';
}

async function clearMediaAndStop() {
  try { audio.pause(); } catch { /* ignore */ }
  if (video) { try { video.pause(); } catch { /* ignore */ } }
  audio.removeAttribute('src');
  audio.load();
  if (video) {
    video.removeAttribute('src');
    video.load();
  }
  state.videoMode = false;
  applyStageMode();
}

audio.addEventListener('play', () => setEngine(true));
audio.addEventListener('playing', () => setEngine(true));
audio.addEventListener('ended', () => {
  const next = findNextIndex(state.index);
  if (next === -1) {
    setEngine(false);
    return;
  }
  loadTrack(next, true);
});
audio.addEventListener('loadedmetadata', () => {
  if (state.index >= 0 && audio.duration) {
    state.tracks[state.index].duration = audio.duration;
    dom.timeTotal.textContent = fmtTime(audio.duration);
    refreshPlayTimeDisplay(audio.currentTime || 0);
    renderPlaylist();
  }
});
function onMediaError(el) {
  return async () => {
    if (media() !== el) return;
    if (state.index < 0) return;
    const track = state.tracks[state.index];
    if (!track) return;

    // 播放中途出错：先 Blob 回退重解码（含 FLAC/MP3），比只覆盖 MP4 更稳
    if (!track.blobTried && track.path && hasDesktop) {
      track.blobTried = true;
      dom.statusNowPlaying.textContent = `重试解码：${track.name}…`;
      const ok = await tryBlobAudioFallback(track);
      if (ok) {
        try {
          await media().play();
          setEngine(true);
          dom.statusNowPlaying.textContent = `正在播放：${track.meta?.title || track.name}`;
          return;
        } catch {
          /* fall through */
        }
      }
    }

    track.unsupported = true;
    renderPlaylist();
    setEngine(false);

    const code = el && el.error ? el.error.code : 0;
    // 2=MEDIA_ERR_NETWORK 3=MEDIA_ERR_DECODE 4=MEDIA_ERR_SRC_NOT_SUPPORTED
    let hint = '格式或编码不受支持';
    if (code === 2) hint = '读取中断，请检查文件是否被占用';
    else if (code === 3) hint = '文件可能损坏或不完整（解码失败）';
    else if (/\.(mp4|m4v)$/i.test(track.name || '')) {
      hint = 'MP4 若为 HEVC/AC3/DTS 等音轨，内置 Chromium 无法解码';
    }
    dom.statusNowPlaying.textContent = `播放中断：${track.name}（${hint}）`;
  };
}

audio.addEventListener('error', onMediaError(audio));
if (video) {
  video.addEventListener('play', () => setEngine(true));
  video.addEventListener('playing', () => setEngine(true));
  video.addEventListener('pause', () => setEngine(false));
  video.addEventListener('ended', () => {
    const next = findNextIndex(state.index);
    if (next === -1) {
      setEngine(false);
      return;
    }
    loadTrack(next, true);
  });
  video.addEventListener('loadedmetadata', () => {
    if (state.index >= 0 && video.duration) {
      state.tracks[state.index].duration = video.duration;
      dom.timeTotal.textContent = fmtTime(video.duration);
      refreshPlayTimeDisplay(video.currentTime || 0);
      renderPlaylist();
    }
  });
  video.addEventListener('timeupdate', () => {
    if (!state.videoMode) return;
    if (!video.src || video.paused) return;
    if (state.index < 0) return;
    state.resumePosition = video.currentTime || 0;
    const track = state.tracks[state.index];
    if (track?.path && state.resumePosition > 0.8) {
      state.trackPositions = state.trackPositions || {};
      state.trackPositions[pathKeyOf(track.path)] = state.resumePosition;
    }
    persistPlaybackProgress(false);
  });
  video.addEventListener('seeked', () => {
    if (!state.videoMode) return;
    state.resumePosition = video.currentTime || 0;
    persistPlaybackProgress(true);
  });
  video.addEventListener('error', onMediaError(video));
}

function tryBlobAudioFallback(track) {
  return (async () => {
    if (!hasDesktop || !track?.path || !window.jt.readBuffer) return false;
    try {
      const buf = await window.jt.readBuffer(track.path);
      if (!buf || buf.byteLength < 16) return false;
      if (buf.byteLength > 32 * 1024 * 1024) return false;
      const blob = new Blob([buf], { type: mimeForAudioName(track.name || track.path) });
      if (track.blobUrl) {
        try { URL.revokeObjectURL(track.blobUrl); } catch { /* ignore */ }
      }
      track.blobUrl = URL.createObjectURL(blob);
      const el = media();
      el.src = track.blobUrl;
      el.load();
      if (state.videoMode) applyStageMode();
      return await waitAudioReady(6000);
    } catch {
      return false;
    }
  })();
}

dom.btnPlay.addEventListener('click', togglePlay);
dom.btnPrev.addEventListener('click', () => {
  const em = media();
  if (em.currentTime > 3) {
    em.currentTime = 0;
    return;
  }
  const prev = findPrevIndex(state.index < 0 ? 0 : state.index);
  if (prev >= 0) playIndex(prev);
});
dom.btnNext.addEventListener('click', () => {
  const next = findNextIndex(state.index < 0 ? 0 : state.index, true);
  if (next >= 0) playIndex(next);
});

async function openFileDialog() {
  if (hasDesktop) {
    const paths = await window.jt.openFiles();
    if (paths?.length) await addPaths(paths);
  } else {
    dom.fileInput.click();
  }
}

async function openFolderDialog() {
  if (hasDesktop) {
    const paths = await window.jt.openFolder();
    if (paths?.length) await addPaths(paths);
  } else {
    dom.fileInput.setAttribute('webkitdirectory', '');
    dom.fileInput.click();
  }
}

if (dom.btnAddFiles) dom.btnAddFiles.addEventListener('click', openFileDialog);
if (dom.btnAddFolder) dom.btnAddFolder.addEventListener('click', openFolderDialog);

if (dom.btnSearch) {
  dom.btnSearch.addEventListener('click', () => {
    if (dom.playlistSearchBar && !dom.playlistSearchBar.hidden) {
      // 已打开：有关键字则在命中之间定位到下一条
      if (state.searchQuery.trim()) {
        locateSearchHit(1);
        return;
      }
      dom.playlistSearchInput?.focus();
      return;
    }
    openPlaylistSearch();
  });
}

if (dom.btnSearchClear) {
  dom.btnSearchClear.addEventListener('click', () => {
    closePlaylistSearch();
  });
}

if (dom.playlistSearchInput) {
  let searchTimer = null;
  dom.playlistSearchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      applySearchQuery(dom.playlistSearchInput.value);
    }, 120);
  });
  dom.playlistSearchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applySearchQuery(dom.playlistSearchInput.value);
      locateSearchHit(e.shiftKey ? 1 : 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePlaylistSearch();
    }
  });
}

dom.btnClear.addEventListener('click', () => {
  hidePlaylistMenu();
  if (!state.tracks.length) {
    clearPlaylist();
    return;
  }
  openConfirm(
    `确定要清空播放列表吗？\n当前共 ${state.tracks.length} 首歌曲将从列表移除（不会删除磁盘文件）。`,
    () => clearPlaylist()
  );
});

if (dom.playlistMenu) {
  dom.playlistMenu.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;
    const action = btn.getAttribute('data-action');
    const idxs = getSelectedIndices();
    const idx = idxs.length ? idxs[idxs.length - 1] : state.index;
    hidePlaylistMenu();
    if (action === 'play' && idx >= 0) {
      setSingleSelection(idx);
      playIndex(idx);
    } else if (action === 'remove') {
      const n = (idxs.length ? idxs : (idx >= 0 ? [idx] : [])).length;
      const targets = idxs.length ? idxs : (idx >= 0 ? [idx] : []);
      if (!targets.length) return;
      openConfirm(`确定从列表删除选中的 ${n} 首歌曲吗？`, () => {
        removeTracksAt(targets);
      });
    } else if (action === 'clear') {
      if (!state.tracks.length) {
        clearPlaylist();
        return;
      }
      openConfirm(
        `确定要清空播放列表吗？\n当前共 ${state.tracks.length} 首歌曲将从列表移除（不会删除磁盘文件）。`,
        () => clearPlaylist()
      );
    }
  });
}

document.addEventListener('click', (e) => {
  if (!dom.playlistMenu || dom.playlistMenu.hidden) return;
  if (e.target.closest('#playlistMenu')) return;
  hidePlaylistMenu();
});
window.addEventListener('blur', hidePlaylistMenu);
if (dom.playlist) {
  dom.playlist.addEventListener('scroll', hidePlaylistMenu);
}

if (dom.btnRepeat) {
  dom.btnRepeat.addEventListener('click', () => {
    // 单曲循环 → 随机 → 列表循环 → 单曲循环
    state.repeat = state.repeat === 'one' ? 'shuffle' : state.repeat === 'shuffle' ? 'all' : 'one';
    updateRepeatBtn();
    saveSettings({ repeat: state.repeat });
    if (dom.setRepeat) dom.setRepeat.value = state.repeat;
  });
}

dom.volumeBar.addEventListener('input', () => {
  state.volume = Number(dom.volumeBar.value) / 100;
  state.muted = state.volume === 0;
  applyVolume();
});

// 音量区滚轮调音量
function onVolumeWheel(e) {
  e.preventDefault();
  const step = state.volumeStep || 0.05;
  const delta = e.deltaY < 0 ? step : -step;
  state.volume = Math.min(1, Math.max(0, state.volume + delta));
  state.muted = state.volume <= 0;
  applyVolume();
}
if (dom.volumeBar) dom.volumeBar.addEventListener('wheel', onVolumeWheel, { passive: false });
const volBlock = document.querySelector('.vol-block');
if (volBlock) volBlock.addEventListener('wheel', onVolumeWheel, { passive: false });
const volRow = document.querySelector('.vol-row');
if (volRow) volRow.addEventListener('wheel', onVolumeWheel, { passive: false });

dom.btnMute.addEventListener('click', () => {
  state.muted = !state.muted;
  applyVolume();
  dom.btnMute.classList.toggle('active', state.muted);
});

dom.seekBar.addEventListener('pointerdown', () => { state.seeking = true; });
dom.seekBar.addEventListener('pointerup', () => { state.seeking = false; });
dom.seekBar.addEventListener('change', () => {
  const smel = media();
  if (!smel.duration) return;
  smel.currentTime = (Number(dom.seekBar.value) / 1000) * smel.duration;
  state.seeking = false;
  drawWave();
});
dom.seekBar.addEventListener('input', () => {
  const smel2 = media();
  if (!smel2.duration) return;
  const t = (Number(dom.seekBar.value) / 1000) * smel2.duration;
  refreshPlayTimeDisplay(t);
});

function seekRatioFromClientX(clientX) {
  const host = dom.waveHit || dom.waveCanvas;
  const rect = host.getBoundingClientRect();
  if (!rect.width) return 0;
  return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
}

function applySeekRatio(ratio) {
  const em = media();
  if (!em.duration || !Number.isFinite(em.duration)) return 0;
  const t = Math.min(em.duration, Math.max(0, ratio * em.duration));
  em.currentTime = t;
  state.resumePosition = t;
  refreshPlayTimeDisplay(t);
  if (dom.seekBar) dom.seekBar.value = String(Math.floor(ratio * 1000));
  if (!state.videoMode) syncLyrics(t);
  drawWave();
  return t;
}

function updateScrubLine(clientX) {
  if (!dom.waveHit || !dom.waveScrubLine) return;
  const rect = dom.waveHit.getBoundingClientRect();
  const x = Math.min(rect.width, Math.max(0, clientX - rect.left));
  dom.waveScrubLine.hidden = false;
  dom.waveScrubLine.style.left = `${x}px`;
}

function endWaveScrub() {
  state.seeking = false;
  if (dom.waveScrubLine) dom.waveScrubLine.hidden = true;
  drawWave();
}

if (dom.waveHit) {
  dom.waveHit.addEventListener('pointerdown', (e) => {
    if (e.button != null && e.button !== 0) return;
    const em = media();
    if (!em.duration) return;
    e.preventDefault();
    state.seeking = true;
    dom.waveHit.setPointerCapture?.(e.pointerId);
    applySeekRatio(seekRatioFromClientX(e.clientX));
    updateScrubLine(e.clientX);
  });
  dom.waveHit.addEventListener('pointermove', (e) => {
    if (!state.seeking) return;
    e.preventDefault();
    applySeekRatio(seekRatioFromClientX(e.clientX));
    updateScrubLine(e.clientX);
  });
  dom.waveHit.addEventListener('pointerup', (e) => {
    if (!state.seeking) return;
    applySeekRatio(seekRatioFromClientX(e.clientX));
    endWaveScrub();
  });
  dom.waveHit.addEventListener('pointercancel', endWaveScrub);
  dom.waveHit.addEventListener('lostpointercapture', endWaveScrub);
  dom.waveHit.addEventListener('click', (e) => {
    if (state.seeking) return;
    const em = media();
    if (!em.duration) return;
    applySeekRatio(seekRatioFromClientX(e.clientX));
  });
}

// DSP / EQ
const DSP_CYCLE = ['FLAT', 'VOCAL', 'CLASSIC', 'JAZZ', 'ROCK', 'HEADPHONE', 'BASS', 'TREBLE', 'CUSTOM'];

if (dom.btnDsp) {
  dom.btnDsp.addEventListener('click', () => {
    const cur = DSP_PRESETS[state.eqPreset] ? state.eqPreset : 'FLAT';
    const idx = Math.max(0, DSP_CYCLE.indexOf(cur));
    const mode = DSP_CYCLE[(idx + 1) % DSP_CYCLE.length];
    applyDspPreset(mode);
  });
}

if (dom.btnEq) {
  dom.btnEq.addEventListener('click', () => {
    // 打开均衡器面板
    openEqPanel();
  });
}

if (dom.btnCloseEq) dom.btnCloseEq.addEventListener('click', closeEqPanel);
if (dom.btnCloseEqFoot) {
  dom.btnCloseEqFoot.addEventListener('click', () => {
    persistSettingsFromForm();
    closeEqPanel();
  });
}
if (dom.eqOverlay) {
  dom.eqOverlay.addEventListener('click', (e) => {
    if (e.target === dom.eqOverlay) closeEqPanel();
  });
}
if (dom.eqEnabled) {
  dom.eqEnabled.addEventListener('change', () => {
    state.eqEnabled = !!dom.eqEnabled.checked;
    resumeCtx();
    applyEqToGraph();
    renderEqBands();
    persistSettingsFromForm();
  });
}
if (dom.eqPresetSelect) {
  dom.eqPresetSelect.addEventListener('change', () => {
    applyDspPreset(dom.eqPresetSelect.value || 'FLAT');
  });
}
if (dom.btnEqReset) {
  dom.btnEqReset.addEventListener('click', () => {
    state.eqEnabled = false;
    if (dom.eqEnabled) dom.eqEnabled.checked = false;
    applyDspPreset('FLAT');
  });
}

dom.fileInput.addEventListener('change', async () => {
  const files = dom.fileInput.files;
  if (files?.length) await addBrowserFiles(files);
  dom.fileInput.value = '';
  dom.fileInput.removeAttribute('webkitdirectory');
});

// Keyboard
window.addEventListener('keydown', (e) => {
  const ae = document.activeElement;
  const tag = ae?.tagName;
  const typing = tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    ae?.isContentEditable ||
    (tag === 'INPUT' && !['range', 'checkbox', 'color', 'button', 'submit'].includes(String(ae.type || 'text')));

  // Ctrl+A：曲目列表全选（输入框内不拦截）
  if ((e.ctrlKey || e.metaKey) && (e.code === 'KeyA' || e.key === 'a' || e.key === 'A')) {
    if (typing) return;
    e.preventDefault();
    selectAllTracks();
    return;
  }

  if (tag === 'INPUT' && document.activeElement.type !== 'range') return;
  if (e.code === 'Space') {
    e.preventDefault();
    togglePlay();
  } else if (e.code === 'ArrowRight') {
    if (media().duration) media().currentTime = Math.min(media().duration, media().currentTime + 5);
  } else if (e.code === 'ArrowLeft') {
    if (media().duration) media().currentTime = Math.max(0, media().currentTime - 5);
  } else if (e.code === 'ArrowUp') {
    e.preventDefault();
    state.volume = Math.min(1, state.volume + state.volumeStep);
    state.muted = false;
    applyVolume();
  } else if (e.code === 'ArrowDown') {
    e.preventDefault();
    state.volume = Math.max(0, state.volume - state.volumeStep);
    if (state.volume === 0) state.muted = true;
    applyVolume();
  } else if (e.code === 'KeyN') {
    dom.btnNext.click();
  } else if (e.code === 'KeyP') {
    dom.btnPrev.click();
  } else if (e.code === 'Delete' || e.code === 'Backspace') {
    const inPlaylist = !!e.target.closest?.('.playlist, .playlist-panel, #playlistMenu');
    if (inPlaylist || document.activeElement === document.body) {
      e.preventDefault();
      hidePlaylistMenu();
      const targets = getSelectedIndices();
      if (!targets.length && state.index < 0) return;
      const n = targets.length || 1;
      openConfirm(`确定从列表删除选中的 ${n} 首歌曲吗？`, () => removeSelectedTrack());
    }
  } else if (e.code === 'Escape') {
    hidePlaylistMenu();
    closeSettings();
    closeEqPanel();
    closeConfirm();
  }
});

// Drag & drop
['dragenter', 'dragover'].forEach((ev) => {
  window.addEventListener(ev, (e) => {
    e.preventDefault();
    dom.app.classList.add('dragover');
  });
});
['dragleave', 'drop'].forEach((ev) => {
  window.addEventListener(ev, (e) => {
    e.preventDefault();
    if (ev === 'dragleave' && e.relatedTarget) return;
    dom.app.classList.remove('dragover');
  });
});
window.addEventListener('drop', async (e) => {
  e.preventDefault();
  const files = [...(e.dataTransfer?.files || [])];
  if (!files.length) return;
  if (hasDesktop && window.jt.getPathForFile) {
    const paths = files.map((f) => window.jt.getPathForFile(f)).filter(Boolean);
    if (paths.length === files.length) {
      await addPaths(paths);
      return;
    }
  }
  await addBrowserFiles(files);
});

// Electron file.path via webUtils may not be exposed; fallback File objects
// For Electron 33+, File.path is removed — expose path via preload if needed.
// Our preload doesn't expose path; drag-drop from explorer in Electron still
// works through File objects + object URLs for most formats.

window.addEventListener('resize', () => {
  drawWave();
  drawRta(!state.playing);
  drawLyricBgSpectrum(!state.playing);
});

// Settings UI
if (dom.btnBrand) dom.btnBrand.addEventListener('click', openSettings);

if (dom.btnOpenLyricsCache) {
  dom.btnOpenLyricsCache.addEventListener('click', async () => {
    if (!hasDesktop || !window.jt.openLyricsCacheDir) {
      const hint = el('lyricsCachePathHint');
      if (hint) hint.textContent = '仅桌面版支持打开目录';
      return;
    }
    const r = await window.jt.openLyricsCacheDir();
    const hint = el('lyricsCachePathHint');
    if (hint) {
      if (r && r.ok) hint.textContent = `歌词缓存：${r.path}（已在资源管理器打开）`;
      else hint.textContent = `歌词缓存打开失败：${r?.error || r?.path || ''}`;
    }
  });
}
if (dom.btnCloseSettings) dom.btnCloseSettings.addEventListener('click', closeSettings);
if (dom.btnCloseSettingsFoot) dom.btnCloseSettingsFoot.addEventListener('click', () => {
  persistSettingsFromForm();
  closeSettings();
});
if (dom.btnResetSettings) dom.btnResetSettings.addEventListener('click', () => {
  const s = saveSettings(DEFAULT_SETTINGS);
  applySettings(s);
  fillSettingsForm(s);
});
if (dom.settingsOverlay) {
  dom.settingsOverlay.addEventListener('click', (e) => {
    if (e.target === dom.settingsOverlay) closeSettings();
  });
}
[
  dom.setRepeat,
  dom.setVolumeStep,
  dom.setAutoplay,
  dom.setAutoplayLaunch,
  dom.setCloseAction,
  dom.setShowDeck,
  dom.setSubtitle,
  dom.setOnlineLyrics,
  dom.setLyricsSource,
].forEach((node) => {
  if (!node) return;
  node.addEventListener('change', persistSettingsFromForm);
  node.addEventListener('input', () => {
    if (node === dom.setSubtitle || node.tagName === 'SELECT' || node.type === 'checkbox') {
      persistSettingsFromForm();
    }
  });
});

// Init
(async () => {
  try {
    await restoreAppState();
  } catch (err) {
    console.warn('restore state failed', err);
    applySettings(loadSettings());
  }
  applyVolume();
  updateRepeatBtn();
  renderPlaylist();
  updateNowUI();
  // 按 <audio> 实际状态刷新，自动播放时显示 PLAYING
  syncEngineFromAudio();
  drawWave();
  drawRta(!isAudioActuallyPlaying());
  drawLyricBgSpectrum(!isAudioActuallyPlaying());
  requestAnimationFrame(tick);
  persistAppState(true);
  // play() 在异步恢复里可能稍晚完成，再对齐一次
  setTimeout(syncEngineFromAudio, 300);
  setTimeout(syncEngineFromAudio, 800);
})();

window.addEventListener('beforeunload', () => {
  if (audio.src) {
    state.resumePosition = audio.currentTime || state.resumePosition || 0;
    const track = state.index >= 0 ? state.tracks[state.index] : null;
    if (track?.path && state.resumePosition > 0.8) {
      state.trackPositions = state.trackPositions || {};
      state.trackPositions[pathKeyOf(track.path)] = state.resumePosition;
    }
  }
  persistAppState(true);
});

window.addEventListener('pagehide', () => {
  if (audio.src) {
    state.resumePosition = audio.currentTime || state.resumePosition || 0;
    const track = state.index >= 0 ? state.tracks[state.index] : null;
    if (track?.path && state.resumePosition > 0.8) {
      state.trackPositions = state.trackPositions || {};
      state.trackPositions[pathKeyOf(track.path)] = state.resumePosition;
    }
  }
  persistAppState(true);
});

if (hasDesktop && window.jt.onOpenPaths) {
  window.jt.onOpenPaths(async (paths) => {
    if (Array.isArray(paths) && paths.length) await addPaths(paths);
  });
}

if (hasDesktop && window.jt.onMediaControl) {
  window.jt.onMediaControl((cmd) => {
    if (cmd === 'toggle') togglePlay();
    else if (cmd === 'next') dom.btnNext && dom.btnNext.click();
    else if (cmd === 'prev') dom.btnPrev && dom.btnPrev.click();
    else if (cmd === 'show' && window.jt.showWindow) window.jt.showWindow();
  });
}
