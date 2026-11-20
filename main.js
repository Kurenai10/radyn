'use strict';

const path = require('path');
const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  nativeTheme,
  ipcMain,
  globalShortcut,
  systemPreferences,
  shell,
} = require('electron');
const { createRadioApi, sanitizeStation } = require('./src/radio-api');
const { splitArtistTitle } = require('./src/icy');
const { createArtFinder } = require('./src/art');
const { createStore } = require('./src/store');
const { createMpris } = require('./src/mpris');
const { detectCountryCode } = require('./src/geo');
const { createStreamProxy } = require('./src/stream-proxy');
const { resolveLang, translate } = require('./src/strings');

const APP_NAME = 'Radyn';
const ASSETS = path.join(__dirname, 'assets');
const HLS_URL = /\.m3u8?(\?|$)/i;
const CONTROL_RE = /^--control=(toggle|play|pause|stop|next|prev)$/;

const radioApi = createRadioApi();
const artFinder = createArtFinder();
const streamProxy = createStreamProxy();

let store = null;
let mainWindow = null;
let tray = null;
let mpris = null;
let isQuitting = false;
let lang = 'en';
let pendingControl = parseControl(process.argv);

// Arayüzden gelen oynatma durumu (görev çubuğu, tepsi, MPRIS için)
let playback = { active: false, status: 'stopped', stationName: '' };
// Şu an çalan parça (ICY veya ID3 metadatası)
let nowPlaying = { raw: '', artist: '', title: '', artUrl: '' };
// Her yeni yayın oturumunda artar; eski oturumların metadata olayları yok sayılır
let streamToken = 0;

const icons = {
  prev: nativeImage.createFromPath(path.join(ASSETS, 'btn-prev.png')),
  play: nativeImage.createFromPath(path.join(ASSETS, 'btn-play.png')),
  pause: nativeImage.createFromPath(path.join(ASSETS, 'btn-pause.png')),
  next: nativeImage.createFromPath(path.join(ASSETS, 'btn-next.png')),
};

const t = (key, vars) => translate(lang, key, vars);

/** Komut satırından veya jump list'ten gelen --control=... argümanını okur. */
function parseControl(argv) {
  const hit = (argv || []).map((a) => CONTROL_RE.exec(a)).find(Boolean);
  return hit ? hit[1] : null;
}

// ---------------------------------------------------------------- Pencere

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1120,
    height: 740,
    minWidth: 860,
    minHeight: 600,
    title: APP_NAME,
    icon: path.join(ASSETS, 'icon.png'),
    show: false,
    autoHideMenuBar: true,
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#15171c' : '#f4f5f7',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false, // pencere gizliyken de ses ve komutlar kesilmesin
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    pushAccent();
    updateChrome();
  });

  // Kapatınca uygulama tepsiye iner, yayın kesilmez. Çıkış için tepsi menüsü.
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      tray?.setContextMenu(buildTrayMenu());
    }
  });

  // Sayfa dışına gezinmeyi ve yeni pencereleri engelle; bağlantılar tarayıcıda açılır.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file:')) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
    return { action: 'deny' };
  });
}

function showWindow() {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
  tray?.setContextMenu(buildTrayMenu());
}

function toggleWindow() {
  if (!mainWindow) return;
  if (mainWindow.isVisible() && mainWindow.isFocused()) mainWindow.hide();
  else showWindow();
  tray?.setContextMenu(buildTrayMenu());
}

function sendControl(action) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('control', action);
  }
}

// ---------------------------------------------------------------- Görev çubuğu (Windows)

/** Pencere küçük resminde (görev çubuğu önizlemesi) Önceki / Oynat-Durdur / Sonraki düğmeleri. */
function updateThumbar() {
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) return;
  const ok = mainWindow.setThumbarButtons([
    { tooltip: t('prev'), icon: icons.prev, click: () => sendControl('prev') },
    {
      tooltip: playback.active ? t('stop') : t('play'),
      icon: playback.active ? icons.pause : icons.play,
      click: () => sendControl('toggle'),
    },
    { tooltip: t('next'), icon: icons.next, click: () => sendControl('next') },
  ]);
  if (ok === false) console.warn('[taskbar] küçük resim düğmeleri eklenemedi');
  else if (!thumbarLogged) {
    thumbarLogged = true;
    console.log('[taskbar] küçük resim düğmeleri ayarlandı:', ok);
  }
}
let thumbarLogged = false;

/** Görev çubuğu simgesinin sağ tık menüsü (Jump List) için hızlı işlemler. */
function updateJumpList() {
  if (process.platform !== 'win32') return;
  // Geliştirme modunda program yolu electron.exe'dir; uygulama yolunu da argümana eklemek gerekir.
  const extra = app.isPackaged ? [] : [`"${app.getAppPath()}"`];
  const task = (action, title) => ({
    type: 'task',
    program: process.execPath,
    arguments: [...extra, `--control=${action}`].join(' '),
    title,
    description: title,
    iconPath: process.execPath,
    iconIndex: 0,
  });
  try {
    const ok = app.setUserTasks([
      task('toggle', t('menu_toggle')),
      task('prev', t('menu_prev')),
      task('next', t('menu_next')),
    ]);
    console.log('[taskbar] jump list ayarlandı:', ok);
  } catch (err) {
    console.error('Jump List ayarlanamadı:', err.message);
  }
}

// ---------------------------------------------------------------- Tepsi (Windows + Linux)

function createTray() {
  tray = new Tray(nativeImage.createFromPath(path.join(ASSETS, 'tray.png')));
  tray.setToolTip(APP_NAME);
  tray.on('click', toggleWindow);
  tray.setContextMenu(buildTrayMenu());
}

function buildTrayMenu() {
  const visible = mainWindow && mainWindow.isVisible();
  return Menu.buildFromTemplate([
    { label: visible ? t('menu_hide') : t('menu_show'), click: toggleWindow },
    { type: 'separator' },
    { label: t('menu_toggle'), click: () => sendControl('toggle') },
    { label: t('menu_prev'), click: () => sendControl('prev') },
    { label: t('menu_next'), click: () => sendControl('next') },
    { type: 'separator' },
    {
      label: t('menu_quit'),
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);
}

function trayTooltip() {
  if (!playback.active || !playback.stationName) return APP_NAME;
  const track = nowPlaying.title ? ` — ${nowPlaying.title}` : '';
  return `${APP_NAME}\n${playback.stationName}${track}`.slice(0, 127);
}

/** Pencere başlığı, görev çubuğu düğmeleri, tepsi, jump list ve MPRIS tek noktadan güncellenir. */
function updateChrome() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    const label = playback.active && playback.stationName ? playback.stationName : APP_NAME;
    mainWindow.setTitle(label === APP_NAME ? APP_NAME : `${label} — ${APP_NAME}`);
  }
  tray?.setToolTip(trayTooltip());
  tray?.setContextMenu(buildTrayMenu());
  updateThumbar();
  mpris?.update({
    active: playback.active,
    stationName: playback.stationName,
    title: nowPlaying.title,
    artist: nowPlaying.artist,
    artUrl: nowPlaying.artUrl,
  });
}

// ---------------------------------------------------------------- Medya tuşları

function registerMediaKeys() {
  const bindings = {
    MediaPlayPause: 'toggle',
    MediaNextTrack: 'next',
    MediaPreviousTrack: 'prev',
    MediaStop: 'stop',
  };
  for (const [key, action] of Object.entries(bindings)) {
    try {
      globalShortcut.register(key, () => sendControl(action));
    } catch {
      /* tuş başka bir uygulama tarafından alınmış olabilir */
    }
  }
}

// ---------------------------------------------------------------- Tema (Windows vurgu rengi)

function getAccent() {
  try {
    if (typeof systemPreferences.getAccentColor === 'function') {
      const hex = systemPreferences.getAccentColor(); // RRGGBBAA
      if (/^[0-9a-f]{6}/i.test(hex)) return `#${hex.slice(0, 6)}`;
    }
  } catch {
    /* desteklenmiyorsa varsayılan renk kullanılır */
  }
  return null;
}

function pushAccent() {
  mainWindow?.webContents.send('accent', getAccent());
}

// ---------------------------------------------------------------- Şu an çalan

function pushNowPlaying() {
  mainWindow?.webContents.send('nowplaying', nowPlaying);
  updateChrome();
}

function resetNowPlaying() {
  nowPlaying = { raw: '', artist: '', title: '', artUrl: '' };
  pushNowPlaying();
}

function handleStreamTitle(raw) {
  if (typeof raw !== 'string' || !raw.trim() || raw === nowPlaying.raw) return;
  const { artist, title } = splitArtistTitle(raw);
  nowPlaying = { raw, artist, title, artUrl: '' };
  pushNowPlaying();

  artFinder.find({ artist, title }).then((art) => {
    if (!art || nowPlaying.raw !== raw) return; // parça bu arada değiştiyse atla
    nowPlaying = { ...nowPlaying, artUrl: art.artUrl, album: art.album };
    pushNowPlaying();
  });
}

// ---------------------------------------------------------------- Dil

function setLang(next) {
  lang = resolveLang(next);
  store?.setSetting('lang', lang);
  tray?.setContextMenu(buildTrayMenu());
  updateChrome();
  updateJumpList();
}

// ---------------------------------------------------------------- IPC

let homeCountryPromise = null;
/** Konum oturum boyunca bir kez aranır; sonuç (veya başarısızlık) önbelleğe alınır. */
function getHomeCountry() {
  homeCountryPromise ??= detectCountryCode({
    localeCountry: () => app.getLocaleCountryCode(),
  }).then((result) => (result ? result.code : null));
  return homeCountryPromise;
}

function registerIpc() {
  ipcMain.handle('app:info', () => ({ platform: process.platform, version: app.getVersion() }));
  ipcMain.handle('geo:home', () => getHomeCountry());

  ipcMain.handle('api:countries', () => radioApi.countries());
  ipcMain.handle('api:tags', () => radioApi.tags());
  ipcMain.handle('api:stations', (_event, query) => radioApi.stationsFor(query));

  ipcMain.handle('store:get', () => store.getAll());
  ipcMain.handle('store:toggleFavorite', (_event, station) => store.toggleFavorite(station));
  ipcMain.on('store:setSetting', (_event, key, value) => {
    if (key === 'volume' && typeof value === 'number' && value >= 0 && value <= 1) {
      store.setSetting(key, value);
    }
  });

  ipcMain.handle('lang:get', () => lang);
  ipcMain.on('lang:set', (_event, value) => setLang(value));

  ipcMain.handle('accent:get', () => getAccent());

  // Yayın: renderer'ın <audio> öğesi bu yerel adrese bağlanır; şarkı bilgisi aynı akıştan gelir.
  ipcMain.handle('stream:open', async (_event, url) => {
    const token = ++streamToken;
    return streamProxy.open(url, {
      onTitle: (raw) => {
        if (token === streamToken) handleStreamTitle(raw);
      },
    });
  });

  // HLS yayınlarındaki ID3 metadatası renderer'da okunur ve buraya iletilir.
  ipcMain.on('metadata:title', (_event, raw) => handleStreamTitle(raw));

  ipcMain.on('play:started', (_event, station) => {
    const cleaned = sanitizeStation(station);
    if (!cleaned) return;
    store.addRecent(cleaned);
    radioApi.registerClick(cleaned.uuid);
    playback.stationName = cleaned.name;
    resetNowPlaying();
  });

  ipcMain.on('play:stopped', () => {
    streamToken++; // bekleyen başlık olayları artık geçersiz
    resetNowPlaying();
  });

  ipcMain.on('state', (_event, state) => {
    playback = {
      active: Boolean(state?.active),
      status: String(state?.status || 'stopped'),
      stationName: String(state?.stationName || '').slice(0, 120),
    };
    updateChrome();
  });

  // Renderer hazır olunca, uygulama bir jump list komutuyla açıldıysa onu çalıştır.
  ipcMain.on('renderer:ready', () => {
    if (pendingControl) {
      sendControl(pendingControl);
      pendingControl = null;
    }
  });
}

// ---------------------------------------------------------------- Yaşam döngüsü

function init() {
  store = createStore(path.join(app.getPath('userData'), 'veri.json'));
  const saved = store.getAll().settings.lang;
  lang = resolveLang(saved || app.getLocale());
  mpris = createMpris({ onCommand: sendControl });

  registerIpc();
  createWindow();
  createTray();
  updateJumpList();
  registerMediaKeys();

  nativeTheme.on('updated', pushAccent);
}

// Aynı anda ikinci bir kopya açılırsa mevcut pencere öne gelir; jump list komutu ise çalıştırılır.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    const control = parseControl(argv);
    if (control) sendControl(control);
    else showWindow();
  });

  app.whenReady().then(init);

  app.on('activate', showWindow);

  // Pencere kapatılmaz, gizlenir; bu olay uygulamayı kapatmamalı.
  app.on('window-all-closed', () => {});

  app.on('before-quit', () => {
    isQuitting = true;
    streamProxy.close();
    store?.flush();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
