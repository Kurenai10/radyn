'use strict';

/**
 * ICY (Shoutcast/Icecast) akış metadatası okuyucusu.
 * Sunucuya "Icy-MetaData: 1" başlığıyla bağlanır; ses verisi arasına gömülü
 * "StreamTitle='Sanatçı - Şarkı';" bloklarını ayıklar. Ses verisi bu bağlantıda
 * kullanılmaz (oynatma ayrı bir <audio> üzerinden yapılır).
 */

const http = require('http');
const https = require('https');
const { URL } = require('url');

const UA = 'Radyn/1.0';
const RETRY_MIN_MS = 3000;
const RETRY_MAX_MS = 60000;

function decodeMeta(buf) {
  const utf8 = buf.toString('utf8');
  // Eski sunucular Latin-1 gönderir; UTF-8 bozuksa Latin-1 olarak çöz.
  return utf8.includes('�') ? buf.toString('latin1') : utf8;
}

function parseStreamTitle(text) {
  const m = text.match(/StreamTitle='(.*?)';\s*(?:StreamUrl=|$)/s) || text.match(/StreamTitle='(.*?)';/s);
  return m ? m[1].trim() : '';
}

/** "Sanatçı - Şarkı" → { artist, title }. Ayraç yoksa tüm metin başlıktır. */
function splitArtistTitle(raw) {
  const text = String(raw || '').trim();
  const idx = text.indexOf(' - ');
  if (idx > 0) {
    return { artist: text.slice(0, idx).trim(), title: text.slice(idx + 3).trim() };
  }
  return { artist: '', title: text };
}

/**
 * Akışı parça parça alır. Her metaint bayttan sonra 1 bayt uzunluk (×16) ve
 * ardından metadata bloğu gelir.
 */
class IcyParser {
  constructor(metaint) {
    this.metaint = metaint;
    this.metaLen = 0;
    this.metaParts = [];
    this.metaRead = 0;
    this._resetAudio();
  }

  _resetAudio() {
    this.state = 'audio';
    this.audioLeft = this.metaint;
  }

  push(chunk, onTitle) {
    let pos = 0;
    while (pos < chunk.length) {
      if (this.state === 'audio') {
        const take = Math.min(this.audioLeft, chunk.length - pos);
        pos += take;
        this.audioLeft -= take;
        if (this.audioLeft === 0) this.state = 'length';
      } else if (this.state === 'length') {
        this.metaLen = chunk[pos] * 16;
        pos += 1;
        if (this.metaLen === 0) {
          this._resetAudio();
        } else {
          this.state = 'meta';
          this.metaParts = [];
          this.metaRead = 0;
        }
      } else {
        const take = Math.min(this.metaLen - this.metaRead, chunk.length - pos);
        this.metaParts.push(chunk.subarray(pos, pos + take));
        this.metaRead += take;
        pos += take;
        if (this.metaRead === this.metaLen) {
          const text = decodeMeta(Buffer.concat(this.metaParts)).replace(/\0+$/, '');
          this._resetAudio();
          const title = parseStreamTitle(text);
          if (title) onTitle(title);
        }
      }
    }
  }
}

/**
 * Metadata bağlantısını açar ve kopunca üssel geri çekilmeyle yeniden dener.
 * Döner: { stop() }. Akış ICY desteklemiyorsa onEnd('no-metadata') çağrılır.
 */
function openIcyMetadata(streamUrl, { onTitle, onEnd = () => {} } = {}) {
  let stopped = false;
  let done = false;
  let req = null;
  let timer = null;
  let delay = RETRY_MIN_MS;

  function retry() {
    if (stopped || done) return;
    clearTimeout(timer);
    timer = setTimeout(() => connect(streamUrl, 0), delay);
    delay = Math.min(delay * 2, RETRY_MAX_MS);
  }

  function connect(target, redirects) {
    if (stopped || done) return;
    const lib = /^https:/i.test(target) ? https : http;
    req = lib.get(
      target,
      {
        headers: { 'Icy-MetaData': '1', 'User-Agent': UA, Accept: '*/*' },
        timeout: 20000,
      },
      (res) => {
        const { statusCode, headers } = res;

        if (statusCode >= 300 && statusCode < 400 && headers.location && redirects < 5) {
          res.resume();
          connect(new URL(headers.location, target).href, redirects + 1);
          return;
        }
        if (statusCode !== 200) {
          res.resume();
          retry();
          return;
        }

        const metaint = parseInt(headers['icy-metaint'], 10);
        if (!Number.isFinite(metaint) || metaint <= 0) {
          done = true;
          res.destroy();
          onEnd('no-metadata');
          return;
        }

        delay = RETRY_MIN_MS;
        const parser = new IcyParser(metaint);
        res.on('data', (chunk) => parser.push(chunk, onTitle));
        res.on('end', retry);
        res.on('error', retry);
      },
    );
    req.on('timeout', () => req.destroy(new Error('zaman aşımı')));
    req.on('error', retry);
  }

  connect(streamUrl, 0);

  return {
    stop() {
      stopped = true;
      clearTimeout(timer);
      if (req) req.destroy();
    },
  };
}

module.exports = {
  IcyParser,
  parseStreamTitle,
  splitArtistTitle,
  openIcyMetadata,
};
