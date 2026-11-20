'use strict';

/**
 * Radio Browser (radio-browser.info) açık veritabanı istemcisi.
 * Sunucuları sırayla dener; API'nin istediği User-Agent başlığını gönderir.
 * Bu modül yalnızca ana süreçte çalışır (CORS yok, başlık kontrolü bizde).
 */

const MIRRORS = [
  'https://de1.api.radio-browser.info',
  'https://nl1.api.radio-browser.info',
  'https://at1.api.radio-browser.info',
];
const USER_AGENT = 'Radyn/1.0';
const DEFAULT_TIMEOUT_MS = 10000;
const CATEGORY_TYPES = new Set(['top', 'country', 'tag', 'search']);

function isHttpUrl(value) {
  return typeof value === 'string' && /^https?:\/\/\S+$/i.test(value);
}

/** Uygulamanın kullandığı istasyon biçimi. Dışarıdan gelen her veri buradan geçer. */
function sanitizeStation(s) {
  if (!s || typeof s.uuid !== 'string' || !s.uuid) return null;
  if (!isHttpUrl(s.url)) return null;
  const name = String(s.name || '').trim().slice(0, 120);
  return {
    uuid: s.uuid.slice(0, 64),
    name: name || 'İsimsiz istasyon',
    url: s.url,
    favicon: isHttpUrl(s.favicon) ? s.favicon : '',
    country: String(s.country || '').slice(0, 80),
    countryCode: String(s.countryCode || '').slice(0, 3),
    tags: Array.isArray(s.tags) ? s.tags.filter((t) => typeof t === 'string').slice(0, 4) : [],
    codec: String(s.codec || '').slice(0, 16),
    bitrate: Number(s.bitrate) || 0,
    votes: Number(s.votes) || 0,
    language: String(s.language || '').slice(0, 60),
  };
}

/** Radio Browser'ın ham kaydını uygulama biçimine çevirir. */
function normalizeStation(raw) {
  if (!raw) return null;
  const tags = typeof raw.tags === 'string'
    ? raw.tags.split(',').map((t) => t.trim()).filter(Boolean)
    : [];
  return sanitizeStation({
    uuid: raw.stationuuid,
    name: raw.name,
    url: raw.url_resolved || raw.url,
    favicon: raw.favicon,
    country: raw.country,
    countryCode: raw.countrycode,
    tags,
    codec: raw.codec,
    bitrate: raw.bitrate,
    votes: raw.votes,
    language: raw.language,
  });
}

function createRadioApi({
  fetchImpl = globalThis.fetch,
  mirrors = MIRRORS,
  timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) {
  let preferred = 0;

  async function get(route) {
    let lastError = null;
    for (let i = 0; i < mirrors.length; i++) {
      const idx = (preferred + i) % mirrors.length;
      try {
        const res = await fetchImpl(mirrors[idx] + route, {
          headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
          signal: AbortSignal.timeout(timeoutMs),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        preferred = idx;
        return data;
      } catch (err) {
        lastError = err;
      }
    }
    throw new Error(`Radyo veritabanına ulaşılamadı (${lastError ? lastError.message : 'bilinmeyen hata'})`);
  }

  async function stationList(route, params = {}, limit = 300) {
    const query = new URLSearchParams({
      hidebroken: 'true',
      order: 'votes',
      reverse: 'true',
      limit: String(limit),
      ...params,
    });
    const data = await get(`${route}?${query}`);
    const seen = new Set();
    const out = [];
    for (const raw of Array.isArray(data) ? data : []) {
      const station = normalizeStation(raw);
      if (station && !seen.has(station.uuid)) {
        seen.add(station.uuid);
        out.push(station);
      }
    }
    return out;
  }

  /** Ülkeler: Türkçe ad (Intl), istasyon sayısıyla, ada göre sıralı. */
  async function countries() {
    const data = await get('/json/countries');
    const names = new Intl.DisplayNames(['tr'], { type: 'region' });
    const displayName = (c) => {
      try {
        const n = names.of(c.iso_3166_1);
        return n && n !== c.iso_3166_1 ? n : c.name;
      } catch {
        return c.name;
      }
    };
    return (Array.isArray(data) ? data : [])
      .filter((c) => c.iso_3166_1 && c.stationcount > 0)
      .map((c) => ({ code: c.iso_3166_1, count: c.stationcount, name: displayName(c) }))
      .sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  }

  /** Türler (etiketler), en çok istasyonu olanlar. */
  async function tags() {
    const query = new URLSearchParams({ order: 'stationcount', reverse: 'true', hidebroken: 'true', limit: '80' });
    const data = await get(`/json/tags?${query}`);
    return (Array.isArray(data) ? data : [])
      .filter((t) => t.name && t.name.length >= 2 && t.name.length <= 40 && t.stationcount > 0)
      .map((t) => ({ name: t.name, count: t.stationcount }));
  }

  /** Kategori isteği: { type: 'top' | 'country' | 'tag' | 'search', value } */
  async function stationsFor({ type, value } = {}) {
    if (!CATEGORY_TYPES.has(type)) throw new Error('Geçersiz kategori');
    const text = typeof value === 'string' ? value.trim().slice(0, 100) : '';
    const enc = encodeURIComponent;
    switch (type) {
      case 'top':
        return stationList('/json/stations/search', {}, 100);
      case 'country':
        if (!/^[A-Za-z]{2}$/.test(text)) throw new Error('Geçersiz ülke kodu');
        return stationList(`/json/stations/bycountrycodeexact/${enc(text.toUpperCase())}`, {}, 500);
      case 'tag':
        if (!text) throw new Error('Tür adı boş olamaz');
        return stationList(`/json/stations/bytagexact/${enc(text)}`, {}, 300);
      case 'search':
        if (!text) throw new Error('Arama metni boş olamaz');
        return stationList(`/json/stations/byname/${enc(text)}`, {}, 150);
      default:
        throw new Error('Geçersiz kategori');
    }
  }

  /** API'nin istediği tıklama sayacı. Hata oynatmayı etkilemez. */
  async function registerClick(uuid) {
    if (typeof uuid !== 'string' || !uuid) return;
    try {
      await get(`/json/url/${encodeURIComponent(uuid)}`);
    } catch {
      /* sayaç başarısızlığı önemsiz */
    }
  }

  return { countries, tags, stationsFor, registerClick };
}

module.exports = {
  MIRRORS,
  USER_AGENT,
  isHttpUrl,
  sanitizeStation,
  normalizeStation,
  createRadioApi,
};
