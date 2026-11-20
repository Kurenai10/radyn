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
  homeCountry: () => ipcRenderer.invoke('geo:home'),
  stations: (query) => ipcRenderer.invoke('api:stations', query),

  getStore: () => ipcRenderer.invoke('store:get'),
  toggleFavorite: (station) => ipcRenderer.invoke('store:toggleFavorite', station),
  setSetting: (key, value) => ipcRenderer.send('store:setSetting', key, value),

  playStarted: (station) => ipcRenderer.send('play:started', station),
  playStopped: () => ipcRenderer.send('play:stopped'),
  reportState: (state) => ipcRenderer.send('state', state),

  getAccent: () => ipcRenderer.invoke('accent:get'),

  onControl: (callback) => listen('control', callback),
  onNowPlaying: (callback) => listen('nowplaying', callback),
  onAccent: (callback) => listen('accent', callback),
});
