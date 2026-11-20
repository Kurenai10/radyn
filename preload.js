'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/** Kanala dinleyici bağlar; geri çağrıyla dinlemeyi bırakma fonksiyonu döner. */
function listen(channel, callback) {
  const listener = (_event, ...args) => callback(...args);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
}

// Renderer yalnızca bu sınırlı API'yi görür; Node/Electron nesneleri açılmaz.
contextBridge.exposeInMainWorld('radio', {
  info: () => ipcRenderer.invoke('app:info'),
  countries: () => ipcRenderer.invoke('api:countries'),
  tags: () => ipcRenderer.invoke('api:tags'),
  stations: (query) => ipcRenderer.invoke('api:stations', query),
  homeCountry: () => ipcRenderer.invoke('geo:home'),

  getStore: () => ipcRenderer.invoke('store:get'),
  toggleFavorite: (station) => ipcRenderer.invoke('store:toggleFavorite', station),
  setSetting: (key, value) => ipcRenderer.send('store:setSetting', key, value),

  getLang: () => ipcRenderer.invoke('lang:get'),
  setLang: (lang) => ipcRenderer.send('lang:set', lang),

  openStream: (url) => ipcRenderer.invoke('stream:open', url),
  reportTitle: (raw) => ipcRenderer.send('metadata:title', raw),

  playStarted: (station) => ipcRenderer.send('play:started', station),
  playStopped: () => ipcRenderer.send('play:stopped'),
  reportState: (state) => ipcRenderer.send('state', state),
  ready: () => ipcRenderer.send('renderer:ready'),

  getAccent: () => ipcRenderer.invoke('accent:get'),

  onControl: (callback) => listen('control', callback),
  onNowPlaying: (callback) => listen('nowplaying', callback),
  onAccent: (callback) => listen('accent', callback),
});
