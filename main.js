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
const { openIcyMetadata, splitArtistTitle } = require('./src/icy');
const { createArtFinder } = require('./src/art');
const { createStore } = require('./src/store');
const { createMpris } = require('./src/mpris');
const { detectCountryCode } = require('./src/geo');

const APP_NAME = 'Radyn';
const ASSETS = path.join(__dirname, 'assets');
const HLS_URL = /\.m3u8?(\?|$)/i;

const radioApi = createRadioApi();
const artFinder = createArtFinder();

let store = null;
let mainWindow = null;
let tray = null;
let mpris = null;
let isQuitting = false;

// Arayüzden gelen oynatma durumu (görev çubuğu, tepsi, MPRIS için)
let playback = { active: false, status: 'stopped', stationName: '' };
// ICY metadata: şu an çalan parça
let metadataStream = null;
let nowPlaying = { raw: '', artist: '', title: '', artUrl: '' };

const icons = {
  prev: nativeImage.createFromPath(path.join(ASSETS, 'btn-prev.png')),
  play: nativeImage.createFromPath(path.join(ASSETS, 'btn-play.png')),
  pause: nativeImage.createFromPath(path.join(ASSETS, 'btn-pause.png')),
  next: nativeImage.createFromPath(path.join(ASSETS, 'btn-next.png')),
};

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

/** Windows görev çubuğunda pencere küçük resminin altında Önceki / Oynat-Durdur / Sonraki düğmeleri. */
function updateThumbar() {
  if (process.platform !== 'win32' || !mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.setThumbarButtons([
    { tooltip: 'Önceki istasyon', icon: icons.prev, click: () => sendControl('prev') },
    {
      tooltip: playback.active ? 'Durdur' : 'Oynat',
      icon: playback.active ? icons.pause : icons.play,
      click: () => sendControl('toggle'),
    },
    { tooltip: 'Sonraki istasyon', icon: icons.next, click: () => sendControl('next') },
  ]);
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
    { label: visible ? 'Pencereyi gizle' : 'Pencereyi göster', click: toggleWindow },
    { type: 'separator' },
    { label: playback.active ? 'Durdur' : 'Oynat', click: () => sendControl('toggle') },
    { label: 'Önceki istasyon', click: () => sendControl('prev') },
    { label: 'Sonraki istasyon', click: () => sendControl('next') },
    { type: 'separator' },
    {
      label: 'Çıkış',
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

/** Pencere başlığı, görev çubuğu düğmeleri, tepsi ve MPRIS'i tek noktadan günceller. */
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

// ---------------------------------------------------------------- Şu an çalan (ICY)

function pushNowPlaying() {
  mainWindow?.webContents.send('nowplaying', nowPlaying);
  updateChrome();
}

function stopMetadata() {
  metadataStream?.stop();
  metadataStream = null;
  nowPlaying = { raw: '', artist: '', title: '', artUrl: '' };
}

function startMetadata(url) {
  stopMetadata();
  if (HLS_URL.test(url)) {
    pushNowPlaying();
    return; // HLS akışlarında ICY metadatası yok
  }
  metadataStream = openIcyMetadata(url, {
    onTitle: handleStreamTitle,
  });
  pushNowPlaying();
}

function handleStreamTitle(raw) {
  if (raw === nowPlaying.raw) return;
  const { artist, title } = splitArtistTitle(raw);
  nowPlaying = { raw, artist, title, artUrl: '' };
  pushNowPlaying();

  artFinder.find({ artist, title }).then((art) => {
    if (!art || nowPlaying.raw !== raw) return; // parça bu arada değiştiyse atla
    nowPlaying = { ...nowPlaying, artUrl: art.artUrl, album: art.album };
    pushNowPlaying();
  });
}

// ---------------------------------------------------------------- IPC

// Konum oturum boyunca bir kez aranır; sonuç (veya başarısızlık) önbelleğe alınır.
let homeCountryPromise = null;
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

  ipcMain.handle('accent:get', () => getAccent());

  ipcMain.on('play:started', (_event, station) => {
    const cleaned = sanitizeStation(station);
    if (!cleaned) return;
    store.addRecent(cleaned);
    radioApi.registerClick(cleaned.uuid);
    playback.stationName = cleaned.name;
    startMetadata(cleaned.url);
  });

  ipcMain.on('play:stopped', () => {
    stopMetadata();
    pushNowPlaying();
  });

  ipcMain.on('state', (_event, state) => {
    playback = {
      active: Boolean(state?.active),
      status: String(state?.status || 'stopped'),
      stationName: String(state?.stationName || '').slice(0, 120),
    };
    updateChrome();
  });
}

// ---------------------------------------------------------------- Yaşam döngüsü

function init() {
  store = createStore(path.join(app.getPath('userData'), 'veri.json'));
  mpris = createMpris({ onCommand: sendControl });

  registerIpc();
  createWindow();
  createTray();
  registerMediaKeys();

  nativeTheme.on('updated', pushAccent);
}

// Aynı anda ikinci bir kopya açılırsa mevcut pencere öne gelir.
if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', showWindow);

  app.whenReady().then(init);

  app.on('activate', showWindow);

  // Pencere kapatılmaz, gizlenir; bu olay uygulamayı kapatmamalı.
  app.on('window-all-closed', () => {});

  app.on('before-quit', () => {
    isQuitting = true;
    stopMetadata();
    store?.flush();
  });

  app.on('will-quit', () => {
    globalShortcut.unregisterAll();
  });
}
