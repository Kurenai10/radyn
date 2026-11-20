'use strict';

/**
 * Şarkı kapağı arayıcı. iTunes Search API (anahtar gerektirmez) kullanır.
 * Yanlış kapak göstermemek için sanatçı/parça adının makul eşleşmesini ister.
 */

const UA = 'Radyn/1.0';
const TIMEOUT_MS = 8000;

const norm = (s) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '');

function looselyMatches(a, b) {
  const x = norm(a);
  const y = norm(b);
  if (!x || !y) return false;
  if (x === y) return true;
  return Math.min(x.length, y.length) >= 4 && (x.includes(y) || y.includes(x));
}

function createArtFinder({ fetchImpl = globalThis.fetch, cacheSize = 300 } = {}) {
  const cache = new Map();

  async function find({ artist = '', title = '' } = {}) {
    if (!title) return null;
    const key = `${norm(artist)}|${norm(title)}`;
    if (cache.has(key)) return cache.get(key);

    let result = null;
    try {
      const term = [artist, title].filter(Boolean).join(' ');
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=5`;
      const res = await fetchImpl(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const hit = (data.results || []).find(
        (r) => looselyMatches(r.trackName, title) && (!artist || looselyMatches(r.artistName, artist)),
      );
      const art = hit && (hit.artworkUrl100 || hit.artworkUrl60);
      if (art) {
        result = {
          artUrl: art.replace(/\/\d+x\d+bb\./, '/600x600bb.'),
          album: hit.collectionName || '',
        };
      }
    } catch {
      // Ağ hatası: sonucu önbelleğe alma, sonraki denemede tekrar dene.
      return null;
    }

    cache.set(key, result);
    if (cache.size > cacheSize) cache.delete(cache.keys().next().value);
    return result;
  }

  return { find };
}

module.exports = { createArtFinder, looselyMatches };
