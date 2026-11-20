'use strict';

/**
 * Favoriler, son dinlenenler ve ayarlar için JSON kalıcılığı.
 * Yazma işlemi kısa bir gecikmeyle toplanır (ses kaydırıcısı gibi sık çağrılar için).
 */

const fs = require('fs');
const path = require('path');
const { sanitizeStation } = require('./radio-api');

const MAX_RECENT = 30;
const SAVE_DELAY_MS = 300;

function defaults() {
  return { favorites: [], recent: [], settings: { volume: 0.8 } };
}

function createStore(filePath) {
  let data = load();
  let timer = null;

  function load() {
    try {
      const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const base = defaults();
      return {
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites.map(sanitizeStation).filter(Boolean) : base.favorites,
        recent: Array.isArray(parsed.recent) ? parsed.recent.map(sanitizeStation).filter(Boolean).slice(0, MAX_RECENT) : base.recent,
        settings: { ...base.settings, ...(parsed.settings || {}) },
      };
    } catch {
      return defaults();
    }
  }

  function writeNow() {
    try {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      const tmp = `${filePath}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
      fs.renameSync(tmp, filePath);
    } catch (err) {
      console.error('Veriler kaydedilemedi:', err.message);
    }
  }

  function scheduleSave() {
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = null;
      writeNow();
    }, SAVE_DELAY_MS);
  }

  return {
    getAll() {
      return structuredClone(data);
    },

    /** Favori ekler/çıkarır; güncel favori listesini döner. */
    toggleFavorite(rawStation) {
      const station = sanitizeStation(rawStation);
      if (!station) return structuredClone(data.favorites);
      const idx = data.favorites.findIndex((s) => s.uuid === station.uuid);
      if (idx >= 0) data.favorites.splice(idx, 1);
      else data.favorites.unshift(station);
      scheduleSave();
      return structuredClone(data.favorites);
    },

    isFavorite(uuid) {
      return data.favorites.some((s) => s.uuid === uuid);
    },

    addRecent(rawStation) {
      const station = sanitizeStation(rawStation);
      if (!station) return;
      data.recent = [station, ...data.recent.filter((s) => s.uuid !== station.uuid)].slice(0, MAX_RECENT);
      scheduleSave();
    },

    setSetting(key, value) {
      data.settings[key] = value;
      scheduleSave();
    },

    /** Bekleyen yazmayı hemen diske işler (uygulama kapanırken). */
    flush() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
        writeNow();
      }
    },
  };
}

module.exports = { createStore, MAX_RECENT };
